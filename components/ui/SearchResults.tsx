'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type Filters = {
  categories: Set<string>;
  families: Set<string>;
  issues: Set<string>;
  grades: Set<string>;
  durations: Set<string>;
};

type Row = {
  id: string;
  family: string;   // 家別
  issue: string;    // 期數（25冬 / 24夏）
  category: string; // 類別
  title: string;    // 教案名稱
  author: string;   // 撰寫者
  good?: boolean;   // 是否「優良教案」
  liked?: boolean;  // 是否收藏
};

// ---- 排序 ----
const SORTS = [
  { value: 'issue_desc', label: '期數由新到舊' }, // default
  { value: 'issue_asc',  label: '期數由舊到新' },
  { value: 'title_asc',  label: '名稱 A → Z' },
  { value: 'title_desc', label: '名稱 Z → A' },
] as const;

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

// 讓圖片以次綠 (Secondary/700 #728A47) 呈色的近似 filter（若你有彩色 good 圖可直接去掉 style）
const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

export default function SearchResults({
  query,
  filters,
  trigger,              // 每按一次搜尋就 +1
}: {
  query: string;
  filters: Filters;
  trigger: number;
}) {
  const [sort, setSort] = useState<string>('issue_desc');   // 期數由新到舊
  const [onlyGood, setOnlyGood] = useState<boolean>(false); // 「優良教案」開關
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // ---- 產生符合規則的假資料（10 筆相同） ----
  const makeTenRows = (): Row[] => {
    const base: Omit<Row, 'id'> = {
      family: '霧鹿',
      issue: '25冬',
      category: '社會',
      title: '「危」「食」已晚，認識危害農業的災害',
      author: '林庭宇',
      good: false,
      liked: false,
    };
    // 交錯一些 good=true
    return Array.from({ length: 10 }, (_, i) => ({
      ...base,
      id: `fake-${i}`,
      good: i % 2 === 1 || i === 6, // 5~6 筆為優良
    }));
  };

  // ---- 搜尋（假） ----
  useEffect(() => {
    if (trigger === 0) return; // 尚未按搜尋

    const kw = query.trim();

    // OR 條件：關鍵字含「農業」，或三個篩選同時符合（家別=霧鹿 / 期數=25冬 / 類別=社會）
    const hitByKeyword = kw.includes('農業');
    const hitByFilters =
      filters.families.has('霧鹿') &&
      filters.issues.has('25冬') &&
      filters.categories.has('社會');

    let dataset: Row[] = [];
    if (hitByKeyword || hitByFilters) {
      dataset = makeTenRows();
    } else {
      dataset = []; // 沒命中 → 空
    }

    // 依目前篩選再過濾（保持與你的結構一致）
    const inSet = (s: Set<string>, v: string) => s.size === 0 || s.has(v);
    let filtered = dataset.filter((r) =>
      inSet(filters.categories, r.category) &&
      inSet(filters.families,   r.family)   &&
      inSet(filters.issues,     r.issue)    &&
      inSet(filters.grades,     '')         &&
      inSet(filters.durations,  '')
    );

    if (onlyGood) filtered = filtered.filter((r) => !!r.good);

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'issue_desc') return b.issue.localeCompare(a.issue, 'zh-Hant');
      if (sort === 'issue_asc')  return a.issue.localeCompare(b.issue, 'zh-Hant');
      if (sort === 'title_asc')  return a.title.localeCompare(b.title, 'zh-Hant');
      if (sort === 'title_desc') return b.title.localeCompare(a.title, 'zh-Hant');
      return 0;
    });

    setRows(sorted);
    setPage(1); // 每次按搜尋 or 切換排序/優良，都回到第一頁
  }, [trigger, query, filters, sort, onlyGood]);

  const total = rows.length;
  const totalPages = Math.max(0, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  const pageRows = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, total, page]);

  // 收藏切換
  const toggleLike = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, liked: !r.liked } : r))
    );
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
          {/* 優良教案 Icon Button：102×32 */}
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
            <Image
              src="/icons/good.png"
              alt=""
              width={16}
              height={16}
              style={onlyGood ? { filter: 'brightness(0) saturate(100%) invert(55%) sepia(87%) saturate(624%) hue-rotate(346deg) brightness(96%) contrast(95%)' } : undefined}
            />
            <span className="text-[14px] leading-[150%] font-normal font-['Noto_Sans_TC']">
              優良教案
            </span>
          </button>

          {/* 小型排序 Dropdown：140×32，右側 angle-down */}
          <div className="relative h-[32px] w-[140px] rounded-[8px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none h-[32px] w-full rounded-[8px] pl-[12px] pr-[28px] text-[14px] leading-[32px] bg-transparent font-['Noto_Sans_TC'] font-normal border-0 outline-none"
              aria-label="排序方式"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Image
              src="/icons/angle-down.png"
              alt=""
              width={20}
              height={20}
              className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2"
            />
          </div>
        </div>
      </div>

      {/* 表格容器 */}
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
                    {onlyGood && r.good && (
                      <Image
                        src="/icons/good.png"
                        alt=""
                        width={16}
                        height={16}
                        style={goodTint}
                      />
                    )}
                    <span className="truncate">{r.title}</span>
                  </div>
                </BodyCell>
                <BodyCell w="164">{r.author}</BodyCell>
                <BodyCell w="92" center>
                  <Image src="/icons/file-alt.png" alt="查看" width={20} height={20} />
                </BodyCell>
                <BodyCell w="92" center>
                  <button
                    type="button"
                    onClick={() => toggleLike(r.id)}
                    aria-label={r.liked ? '取消收藏' : '加入收藏'}
                  >
                    <Image
                      src={r.liked ? '/icons/liked.png' : '/icons/like.png'}
                      alt=""
                      width={20}
                      height={20}
                    />
                  </button>
                </BodyCell>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination：320×36 */}
      <div className="mt-6 w-[320px] h-[36px] mx-auto flex items-center justify-center gap-2">
        <PageBtn
          icon="/icons/angle-left-double.png"
          disabled={!canPrev}
          onClick={() => setPage(1)}
        />
        <PageBtn
          icon="/icons/angle-left.png"
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        />
        <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
          第 {pad2(totalPages === 0 ? 0 : page)} 頁，共 {pad2(totalPages)} 頁
        </div>
        <PageBtn
          icon="/icons/angle-right.png"
          disabled={!canNext}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
        <PageBtn
          icon="/icons/angle-right-double.png"
          disabled={!canNext}
          onClick={() => setPage(totalPages)}
        />
      </div>
    </section>
  );
}

/** 分頁按鈕：32×36，內有 20×20 icon */
function PageBtn({
  icon,
  disabled,
  onClick,
}: {
  icon: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-[32px] h-[36px] inline-flex items-center justify-center
        rounded-[4px] px-[10px] py-[4px] border border-black-200 bg-white
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black-100'}
      `}
    >
      <Image src={icon} alt="" width={20} height={20} />
    </button>
  );
}

/** 表頭欄位（不換行；小欄位去掉過大的左右 padding） */
function HeaderCell({
  children,
  className = '',
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: 'title' | 'author';
}) {
  const base =
    'flex items-center justify-center text-[14px] font-bold font-["Noto_Sans_TC"] text-black-900 ' +
    'border border-black-200 bg-primary-100 whitespace-nowrap break-normal';
  const padNormal = 'py-2 px-2';
  const padTitle = 'py-2 px-[30px]';
  const wClass =
    wide === 'title'
      ? 'w-[352px]'
      : wide === 'author'
      ? 'w-[164px]'
      : 'w-[92px]';

  return (
    <div className={`${base} ${wClass} ${wide ? padTitle : padNormal} ${className}`} style={{ wordBreak: 'keep-all' }}>
      {children}
    </div>
  );
}

/** 內容欄位 */
function BodyCell({
  children,
  w,
  center = true, // 預設置中
}: {
  children: React.ReactNode;
  w: '92' | '164' | '352';
  center?: boolean;
}) {
  return (
    <div
      className={[
        `w-[${w}px] h-[48px] px-2 flex items-center`,
        center ? 'justify-center text-center' : '',
        'border-x border-b border-black-200 first:border-l-0 last:border-r-0',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

