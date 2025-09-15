'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type Filters = {
  categories: Set<string>;
  families: Set<string>;
  issues: Set<string>;   // 例如：'25冬'、'24夏'
  grades: Set<string>;
  durations: Set<string>;
};

type Row = {
  id: string;
  family: string;   // 家別 → team
  issue: string;    // e.g. '25冬'（academic_year + semester_period）
  category: string; // 類別 → category
  title: string;    // 教案名稱 → tp_name
  author: string;   // 撰寫者 → writer_name
  good?: boolean;   // 是否優良 → is_excellent
  liked?: boolean;
};

const SORTS = [
  { value: 'issue_desc', label: '期數由新到舊' },
  { value: 'issue_asc',  label: '期數由舊到新' },
  { value: 'title_asc',  label: '名稱 A → Z' },
  { value: 'title_desc', label: '名稱 Z → A' },
] as const;

const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';

/** 把 '25冬' 拆成 { year:'25', season:'冬' }；容錯：不符就回空字串 */
function splitIssueToken(token: string) {
  const m = token.match(/^(\d{2})\s*([春夏秋冬])$/);
  if (!m) return { year: '', season: '' };
  return { year: m[1], season: m[2] };
}

/** 建 URLSearchParams：把多選 Set 轉成重複 key；issue 會同時 append 到 academic_year 與 semester_period */
function buildSearchParams(query: string, filters: Filters, onlyGood: boolean) {
  const params = new URLSearchParams();

  // 關鍵字（可多字，用空白切成 search_texts[]=...）
  query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .forEach((t) => params.append('search_texts', t));

  // 多選篩選：categories→category、families→team、grades→grade、durations→duration
  filters.categories.forEach((v) => params.append('category', v));
  filters.families.forEach((v) => params.append('team', v));
  filters.grades.forEach((v) => params.append('grade', v));
  filters.durations.forEach((v) => params.append('duration', v));

  // issues：例如 '25冬' 同時 append academic_year=25 與 semester_period=冬
  // ⚠️ 多個 issue 這樣傳會變成：academic_year IN {25,24} 且 semester_period IN {冬,夏}（「交叉集合」）
  //    如果你要「(25,冬) OR (24,夏)」的配對邏輯，請看本文最後的後端小補丁。
  filters.issues.forEach((tok) => {
    const { year, season } = splitIssueToken(tok);
    if (year) params.append('academic_year', year);
    if (season) params.append('semester_period', season);
  });

  // 只看優良教案 → is_excellent=true（需要後端 SearchFilters 支援；若無會被忽略）
  if (onlyGood) params.append('is_excellent', 'true');

  return params;
}

/** 後端回傳 TeachingPlan → 映射成 Row（符合你表格顯示欄位） */
function mapPlanToRow(p: any): Row {
  return {
    id: String(p.id ?? crypto.randomUUID()),
    family: p.team ?? '',
    issue: `${p.academic_year ?? ''}${p.semester_period ?? ''}`,
    category: p.category ?? '',
    title: p.tp_name ?? '',
    author: p.writer_name ?? '',
    good: !!p.is_excellent,
    liked: false,
  };
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

export default function SearchResults({
  query,
  filters,
  trigger,
}: {
  query: string;
  filters: Filters;
  trigger: number;
}) {
  const [sort, setSort] = useState<string>('issue_desc');
  const [onlyGood, setOnlyGood] = useState<boolean>(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // ---- 真正打 API 的搜尋 ----
  const qs = useMemo(() => buildSearchParams(query, filters, onlyGood), [query, filters, onlyGood]);

  useEffect(() => {
    if (trigger === 0) return; // 尚未按搜尋
    let aborted = false;

    (async () => {
      try {
        const url = `${BACKEND_URL}/api/teaching-plan/search?${qs.toString()}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json(); // { status, data, count, ... }
        const items = Array.isArray(json?.data) ? json.data.map(mapPlanToRow) : [];
        if (!aborted) {
          setRows(items);
          setPage(1);
        }
      } catch (e) {
        if (!aborted) {
          setRows([]);
          setPage(1);
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [trigger, qs]);

  // ---- 前端排序（保留你原本的互動）----
  const seasonRank = (s: string) => ({ 春: 1, 夏: 2, 秋: 3, 冬: 4 } as any)[s] ?? 0;
  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title, 'zh-Hant');
      if (sort === 'title_desc') return b.title.localeCompare(a.title, 'zh-Hant');
      // issue 排序：academic_year（數字） + semester_period（春<夏<秋<冬）
      const ayA = parseInt(a.issue.slice(0, 2) || '0', 10);
      const ayB = parseInt(b.issue.slice(0, 2) || '0', 10);
      const spA = seasonRank(a.issue.slice(2));
      const spB = seasonRank(b.issue.slice(2));
      const cmp = ayA === ayB ? spA - spB : ayA - ayB;
      return sort === 'issue_asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, sort]);

  // ---- 分頁（沿用你原本做法）----
  const total = sortedRows.length;
  const totalPages = Math.max(0, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  const pageRows = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, total, page]);

  const toggleLike = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, liked: !r.liked } : r)));
  };

  return (
    <section className="mt-10 mx-auto w-[976px]">
      {/* 標題 + 右側控制列 */}
      <div className="flex items-end gap-3">
        <h2 className="w-[100px] h-[38px] text-[25px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black-900">
          檢索結果
        </h2>
        <span className="w-[120px] h-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900">
          （共 {total} 筆）
        </span>

        <div className="ml-auto flex items-center gap-3">
          {/* 優良教案切換 */}
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={() => setOnlyGood((v) => !v)}
            className={[
              'h-[32px] w-[102px] inline-flex items-center justify-center gap-[3px]',
              'rounded-[8px] px-[12px] py-[5px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border',
              onlyGood ? 'border-primary-900 text-primary-900' : 'border-transparent text-black-900',
            ].join(' ')}
            title="只看優良教案"
          >
            <Image src="/icons/good.png" alt="" width={16} height={16}
              style={onlyGood ? { filter: 'brightness(0) saturate(100%) invert(55%) sepia(87%) saturate(624%) hue-rotate(346deg) brightness(96%) contrast(95%)' } : undefined}
            />
            <span className="text-[14px] leading-[150%] font-normal font-['Noto_Sans_TC']">優良教案</span>
          </button>

          {/* 排序 */}
          <div className="relative h-[32px] w-[140px] rounded-[8px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none h-[32px] w-full rounded-[8px] pl-[12px] pr-[28px] text-[14px] leading-[32px] bg-transparent font-['Noto_Sans_TC'] font-normal border-0 outline-none"
              aria-label="排序方式"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <Image src="/icons/angle-down.png" alt="" width={20} height={20}
              className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2"
            />
          </div>
        </div>
      </div>

      {/* 表格容器（沿用你的 UI） */}
      <div className="mt-4 w-[976px] mx-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white">
        {/* 表頭 */}
        <div className="w-[976px] h-[48px] flex">
          <HeaderCell className="rounded-tl-lg">家別</HeaderCell>
          <HeaderCell>期數</HeaderCell>
          <HeaderCell>類別</HeaderCell>
          <HeaderCell wide="title">教案名稱</HeaderCell>
          <HeaderCell wide="author">撰寫者</HeaderCell>
          <HeaderCell>查看</HeaderCell>
          <HeaderCell className="rounded-tr-lg">收藏</HeaderCell>
        </div>

        {/* 內容 */}
        {pageRows.length === 0 ? (
          <div className="w-[976px] h-[48px] flex items-center justify-center border-x border-b border-black-200 rounded-b-lg px-11">
            <p className="w-[336px] h-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-700 text-center">
              查無符合條件的教案，請調整檢索條件後再試。
            </p>
          </div>
        ) : (
          <div className="border-x border-b border-black-200 rounded-b-lg divide-y">
            {pageRows.map((r) => (
              <div key={r.id} className="flex h-[48px] items-center text-[14px]">
                <BodyCell w="92">{r.family}</BodyCell>
                <BodyCell w="92">{r.issue}</BodyCell>
                <BodyCell w="92">{r.category}</BodyCell>
                <BodyCell w="352">
                  <div className="flex items-center justify-center gap-2">
                    {r.good && (
                      <Image src="/icons/good.png" alt="" width={16} height={16} style={goodTint} />
                    )}
                    <span className="truncate">{r.title}</span>
                  </div>
                </BodyCell>
                <BodyCell w="164">{r.author}</BodyCell>
                <BodyCell w="92" center>
                  <Image src="/icons/file-alt.png" alt="查看" width={20} height={20} />
                </BodyCell>
                <BodyCell w="92" center>
                  <button type="button" onClick={() => toggleLike(r.id)}
                    aria-label={r.liked ? '取消收藏' : '加入收藏'}>
                    <Image src={r.liked ? '/icons/liked.png' : '/icons/like.png'} alt="" width={20} height={20} />
                  </button>
                </BodyCell>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 w-[320px] h-[36px] mx-auto flex items-center justify-center gap-2">
        <PageBtn icon="/icons/angle-left-double.png" disabled={page <= 1} onClick={() => setPage(1)} />
        <PageBtn icon="/icons/angle-left.png" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
          第 {pad2(total === 0 ? 0 : page)} 頁，共 {pad2(Math.max(1, Math.ceil(total / pageSize)))} 頁
        </div>
        <PageBtn icon="/icons/angle-right.png" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))} />
        <PageBtn icon="/icons/angle-right-double.png" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(Math.ceil(total / pageSize))} />
      </div>
    </section>
  );
}

/** 分頁按鈕 / 表頭 / 內容欄位（原樣保留） */
function PageBtn({ icon, disabled, onClick }: { icon: string; disabled?: boolean; onClick?: () => void; }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`w-[32px] h-[36px] inline-flex items-center justify-center rounded-[4px] px-[10px] py-[4px] border border-black-200 bg-white ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black-100'}`}>
      <Image src={icon} alt="" width={20} height={20} />
    </button>
  );
}
function HeaderCell({ children, className = '', wide }: { children: React.ReactNode; className?: string; wide?: 'title' | 'author'; }) {
  const base =
    'flex items-center justify-center text-[14px] font-bold font-["Noto_Sans_TC"] text-black-900 border border-black-200 bg-primary-100 whitespace-nowrap break-normal';
  const padNormal = 'py-2 px-2';
  const padTitle = 'py-2 px-[30px]';
  const wClass = wide === 'title' ? 'w-[352px]' : wide === 'author' ? 'w-[164px]' : 'w-[92px]';
  return <div className={`${base} ${wClass} ${wide ? padTitle : padNormal} ${className}`} style={{ wordBreak: 'keep-all' }}>{children}</div>;
}
function BodyCell({ children, w, center = true }: { children: React.ReactNode; w: '92' | '164' | '352'; center?: boolean; }) {
  return (
    <div className={[`w-[${w}px] h-[48px] px-2 flex items-center`, center ? 'justify-center text-center' : '', 'border-x border-b border-black-200 first:border-l-0 last:border-r-0',].join(' ')}>
      {children}
    </div>
  );
}
