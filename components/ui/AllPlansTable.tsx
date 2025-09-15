'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export type Row = {
  id: string;
  family: string;
  issue: string;
  category: string;
  title: string;
  author: string;
  good?: boolean;
  liked?: boolean;
};

const SORTS = [
  { value: 'issue_desc', label: '期數由新到舊' }, // default
  { value: 'issue_asc',  label: '期數由舊到新' },
  { value: 'title_asc',  label: '名稱 A → Z' },
  { value: 'title_desc', label: '名稱 Z → A' },
] as const;

const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

export function AllPlansTable({
  title,       // '我的教案' | '我的收藏'
  rowsInput,
  mode,        // 'mine' | 'likes'
}: {
  title: string;
  rowsInput: Row[];
  mode: 'mine' | 'likes';
}) {
  const [sort, setSort] = useState<string>('issue_desc');
  const [onlyGood, setOnlyGood] = useState<boolean>(false);
  const [rows, setRows] = useState<Row[]>(rowsInput);
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;
  const router = useRouter();

  useEffect(() => {
    let dataset = [...rowsInput];

    // 收藏頁預設只看 liked；開啟「優良教案」則 liked && good
    if (mode === 'likes') {
      dataset = dataset.filter((r) => r.liked);
      if (onlyGood) dataset = dataset.filter((r) => r.good);
    } else {
      if (onlyGood) dataset = dataset.filter((r) => r.good);
    }

    dataset.sort((a, b) => {
      if (sort === 'issue_desc') return b.issue.localeCompare(a.issue, 'zh-Hant');
      if (sort === 'issue_asc')  return a.issue.localeCompare(b.issue, 'zh-Hant');
      if (sort === 'title_asc')  return a.title.localeCompare(b.title, 'zh-Hant');
      if (sort === 'title_desc') return b.title.localeCompare(a.title, 'zh-Hant');
      return 0;
    });

    setRows(dataset);
    setPage(1);
  }, [rowsInput, sort, onlyGood, mode]);

  const total = rows.length;
  const totalPages = Math.max(0, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  const pageRows = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, total, page]);

  return (
    <section className="mt-10 mx-auto w-[976px]">
      {/* 置頂置中大標 */}
      <h1
        className="
          text-center
          font-['Noto_Sans_TC'] font-bold
          text-[40px] leading-[150%] tracking-normal
          text-black-900
        "
      >
        {title}
      </h1>

      {/* 左：統計句；右：控制列 */}
      <div className="mt-6 flex items-end gap-3">
        <p className="font-['Noto_Sans_TC'] font-bold text-[25px] leading-[150%] text-black-900">
          你已{mode === 'mine' ? '上傳' : '收藏'}{' '}
          <span className="text-primary-900">{rowsInput.length}</span>{' '}
          份教案！
        </p>

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

          {/* 排序下拉（Default：期數由新到舊） */}
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
          {mode === 'mine' ? (
            <>
              <HeaderCell>編輯</HeaderCell>
              <HeaderCell className="rounded-tr-lg">刪除</HeaderCell>
            </>
          ) : (
            <>
              <HeaderCell>查看</HeaderCell>
              <HeaderCell className="rounded-tr-lg">收藏</HeaderCell>
            </>
          )}
        </div>

        {/* 內容 */}
        {pageRows.length === 0 ? (
          <div className="w-[976px] h-[48px] flex items-center justify-center border-x border-b border-black-200 rounded-b-lg px-11">
            <p className="w-[336px] text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-normal text-black-700 text-center">
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
                    {/* 只有在開啟「優良教案」時顯示徽章（對齊 SearchResults） */}
                    {onlyGood && r.good && (
                      <Image src="/icons/good.png" alt="" width={16} height={16} style={goodTint} />
                    )}
                    <span className="truncate">{r.title}</span>
                  </div>
                </BodyCell>
                <BodyCell w="164">{r.author}</BodyCell>

                {mode === 'mine' ? (
                  <>
                    <BodyCell w="92" center>
                      <Image src="/icons/edit.png" alt="編輯" width={20} height={20} />
                    </BodyCell>
                    <BodyCell w="92" center>
                      <Image src="/icons/trash.png" alt="刪除" width={20} height={20} />
                    </BodyCell>
                  </>
                ) : (
                  <>
                    <BodyCell w="92" center>
                      <Image src="/icons/file-alt.png" alt="查看" width={20} height={20} />
                    </BodyCell>
                    <BodyCell w="92" center>
                      <Image src={r.liked ? '/icons/liked.png' : '/icons/like.png'} alt="收藏" width={20} height={20} />
                    </BodyCell>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    {/* === 底部區塊 === */}
      {mode === 'mine' ? (
        // 我的教案：中間「上傳教案」＋右側分頁
        <div className="mt-6 w-[976px] mx-auto grid grid-cols-3 items-center">
          <div /> {/* 佔位用 */}
          {/* 上傳教案：置中 */}
          <div className="justify-self-center">
            <button
              type="button"
              onClick={() => router.push('/upload')}
              className="
                w-[160px] h-[48px] rounded-[8px] bg-primary-900
                px-[48px] py-[12px]
                text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-bold text-white
                shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
              "
            >
              上傳教案
            </button>
          </div>

          {/* 分頁：靠右 */}
          <div className="justify-self-end">
            <div className="h-[36px] flex items-center justify-end gap-2">
              <PageBtn icon="/icons/angle-left-double.png" disabled={!canPrev} onClick={() => setPage(1)} />
              <PageBtn icon="/icons/angle-left.png" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} />
              <div className="h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
                第 {pad2(totalPages === 0 ? 0 : page)} 頁{/* ，共 {pad2(totalPages)} 頁 */}
              </div>
              <PageBtn icon="/icons/angle-right.png" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              <PageBtn icon="/icons/angle-right-double.png" disabled={!canNext} onClick={() => setPage(totalPages)} />
            </div>
          </div>
        </div>
      ) : (
        // 我的收藏：分頁置中（維持原樣）
        <div className="mt-6 w-[320px] h-[36px] mx-auto flex items-center justify-center gap-2">
          <PageBtn icon="/icons/angle-left-double.png" disabled={!canPrev} onClick={() => setPage(1)} />
          <PageBtn icon="/icons/angle-left.png" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} />
          <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
            第 {pad2(totalPages === 0 ? 0 : page)} 頁，共 {pad2(totalPages)} 頁
          </div>
          <PageBtn icon="/icons/angle-right.png" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
          <PageBtn icon="/icons/angle-right-double.png" disabled={!canNext} onClick={() => setPage(totalPages)} />
        </div>
      )}
    </section>
  );
}

/** 分頁按鈕：32×36，內有 20×20 icon */
function PageBtn({ icon, disabled, onClick }: { icon: string; disabled?: boolean; onClick?: () => void; }) {
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
function HeaderCell({ children, className = '', wide }:{
  children: React.ReactNode; className?: string; wide?: 'title' | 'author';
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
function BodyCell({ children, w, center = true }:{
  children: React.ReactNode; w: '92' | '164' | '352'; center?: boolean;
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
