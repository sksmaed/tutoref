'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compareIssues } from '@/lib/issues';
import IssueSortDropdown, { ISSUE_SORT_OPTIONS } from '@/features/teaching-plan/IssueSortDropdown';
import { readSessionJson, writeSessionJson } from '@/lib/session-cache';

export type Row = {
  id: string;
  family: string;
  issue: string;
  category: string;
  title: string;
  author: string;
  good?: boolean;
  liked?: boolean;
  grade?: string;
  duration?: number;
  viewCount?: number;
  searchScore?: number;
  createdAt?: number;
  hashtags?: string[];
};

const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

type IssueSortValue = (typeof ISSUE_SORT_OPTIONS)[number]['value'];

type TableUiState = {
  sort: IssueSortValue;
  onlyGood: boolean;
  page: number;
};

export function AllPlansTable({
  title,
  rowsInput,
  mode,
  uiStateStorageKey,
  onToggleFavorite,
  onEdit,
  onDelete,
  onView,
}: {
  title: string;
  rowsInput: Row[];
  mode: 'mine' | 'likes';
  /** 提供時，排序／篩選／頁碼會存進 sessionStorage，回到頁面時還原。 */
  uiStateStorageKey?: string;
  onToggleFavorite?: (row: Row, nextLiked: boolean) => Promise<void>;
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => Promise<void>;
  onView?: (row: Row) => void;
}) {
  const initialUiState = useMemo<TableUiState>(() => {
    if (!uiStateStorageKey) {
      return { sort: 'issue_desc', onlyGood: false, page: 1 };
    }
    const cachedState = readSessionJson<TableUiState>(uiStateStorageKey);
    if (!cachedState) {
      return { sort: 'issue_desc', onlyGood: false, page: 1 };
    }

    const safeSort = ISSUE_SORT_OPTIONS.some((item) => item.value === cachedState.sort)
      ? cachedState.sort
      : 'issue_desc';
    const safePage = Number.isFinite(cachedState.page) && cachedState.page > 0
      ? Math.floor(cachedState.page)
      : 1;
    return {
      sort: safeSort,
      onlyGood: Boolean(cachedState.onlyGood),
      page: safePage,
    };
  }, [uiStateStorageKey]);

  const [sort, setSort] = useState<IssueSortValue>(initialUiState.sort);
  const [onlyGood, setOnlyGood] = useState<boolean>(initialUiState.onlyGood);
  const [baseRows, setBaseRows] = useState<Row[]>(rowsInput);
  const [rows, setRows] = useState<Row[]>(rowsInput);
  const [page, setPage] = useState<number>(initialUiState.page);
  const isFirstRender = useRef(true);
  const pageSize = 8;
  const router = useRouter();

  useEffect(() => {
    if (!uiStateStorageKey) return;
    writeSessionJson(uiStateStorageKey, { sort, onlyGood, page });
  }, [uiStateStorageKey, sort, onlyGood, page]);

  const handleToggleLike = async (row: Row) => {
    const nextLiked = !(row.liked ?? false);
    const previous = baseRows.map((r) => ({ ...r }));

    let optimistic: Row[];
    if (mode === 'likes' && !nextLiked) {
      optimistic = baseRows.filter((r) => r.id !== row.id);
    } else {
      optimistic = baseRows.map((r) => (r.id === row.id ? { ...r, liked: nextLiked } : r));
    }
    setBaseRows(optimistic);

    if (!onToggleFavorite) {
      setBaseRows(previous);
      return;
    }

    try {
      await onToggleFavorite(row, nextLiked);
    } catch (error) {
      setBaseRows(previous);
    }
  };

  useEffect(() => {
    setBaseRows(rowsInput);
  }, [rowsInput]);

  useEffect(() => {
    let dataset = [...baseRows];

    // 收藏頁預設只看 liked；開啟「優良教案」則 liked && good
    if (mode === 'likes') {
      dataset = dataset.filter((r) => r.liked);
      if (onlyGood) dataset = dataset.filter((r) => r.good);
    } else {
      if (onlyGood) dataset = dataset.filter((r) => r.good);
    }

    dataset.sort((a, b) => {
      switch (sort) {
        case 'issue_asc':
          return compareIssues(a.issue, b.issue);
        case 'views_desc':
          return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        case 'relevance_desc':
          return (b.searchScore ?? 0) - (a.searchScore ?? 0);
        case 'uploaded_desc':
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        case 'issue_desc':
        default:
          return compareIssues(b.issue, a.issue);
      }
    });

    setRows(dataset);
  }, [baseRows, sort, onlyGood, mode]);

  // 排序／篩選變更時回到第一頁；首次渲染略過，才不會蓋掉還原的頁碼
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [sort, onlyGood]);

  const total = rows.length;
  const totalPages = Math.max(0, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, total, page]);

  return (
    <section className="mt-10 mx-auto w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
      {/* 置頂置中大標 */}
      <h1
        className="
          text-center
          font-['Noto_Sans_TC'] font-bold
          text-[28px] sm:text-[40px] leading-[150%] tracking-normal
          text-black-900
        "
      >
        {title}
      </h1>

      {/* 左：統計句；右：控制列 */}
      <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-2">
        {/* 第一行（手機）/ 同行（sm+）：統計句 */}
        <p className="font-['Noto_Sans_TC'] font-bold text-[20px] sm:text-[25px] leading-[150%] text-black-900 w-full sm:w-auto">
          你已{mode === 'mine' ? '上傳' : '收藏'}{' '}
          <span className="text-primary-900">{mode === 'likes' ? baseRows.length : rowsInput.length}</span>{' '}
          份教案！
        </p>

        {/* 第二行（手機）/ 靠右同行（sm+）：控制按鈕 */}
        <div className="flex items-center gap-3 sm:ml-auto">
          {/* 優良教案 Icon Button：102×32 */}
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={() => setOnlyGood((v) => !v)}
            className={[
              'h-[32px] w-auto inline-flex items-center justify-center gap-[3px] whitespace-nowrap px-[12px]',
              'rounded-[8px] py-[5px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border cursor-pointer',
              onlyGood
                ? 'border-secondary-700 text-secondary-700'
                : 'border-transparent text-black-900 hover:bg-black-100/60',
            ].join(' ')}
            title="只看優良教案"
          >
            <img
              src="/icons/good.svg"
              alt=""
              width={16}
              height={16}
              style={onlyGood ? goodTint : undefined}
            />
            <span className="text-[14px] leading-[150%] font-normal font-['Noto_Sans_TC']">
              優良教案
            </span>
          </button>

          {/* 排序下拉（Default：期數由新到舊） */}
          <IssueSortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* 桌機表格（md 以上） */}
      <div className="mt-4 w-full hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <table className="w-full border-collapse text-[14px] font-['Noto_Sans_TC']">
          <colgroup>
            <col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[9%]" />
            <col /><col className="w-[14%]" /><col className="w-[7%]" /><col className="w-[7%]" />
          </colgroup>
          <thead>
            <tr className="bg-primary-100 text-black-900 font-bold">
              {['家別','期數','類別','教案名稱','撰寫者', mode === 'mine' ? '編輯' : '查看', mode === 'mine' ? '刪除' : '收藏'].map((h, i) => (
                <th key={h} className={`h-[48px] px-3 text-center border border-black-200 whitespace-nowrap ${i === 0 ? 'rounded-tl-lg' : ''} ${i === 6 ? 'rounded-tr-lg' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black-200">
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} className="h-[48px] text-center text-black-700 border-x border-b border-black-200">
                查無符合條件的教案，請調整檢索條件後再試。
              </td></tr>
            ) : pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-primary-50 transition-colors">
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.family}</td>
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.issue}</td>
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.category}</td>
                <td className="h-[48px] px-4 border-x border-black-200 max-w-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {r.good && <img src="/icons/good.svg" alt="" width={16} height={16} style={goodTint} className="shrink-0" />}
                    <span className="truncate" title={r.title}>{r.title}</span>
                  </div>
                </td>
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.author}</td>
                <td className="h-[48px] text-center border-x border-black-200">
                  {mode === 'mine' ? (
                    <button type="button" onClick={() => onEdit?.(r)} aria-label="編輯" disabled={!onEdit}
                      className={!onEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/edit.svg" alt="編輯" width={20} height={20} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => onView?.(r)} aria-label="查看" disabled={!onView}
                      className={!onView ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/file-alt.svg" alt="查看" width={20} height={20} />
                    </button>
                  )}
                </td>
                <td className="h-[48px] text-center border-x border-black-200">
                  {mode === 'mine' ? (
                    <button type="button" onClick={() => onDelete?.(r)} aria-label="刪除" disabled={!onDelete}
                      className={!onDelete ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/trash.svg" alt="刪除" width={20} height={20} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleToggleLike(r)} aria-label={r.liked ? '取消收藏' : '加入收藏'}
                      className="cursor-pointer hover:opacity-80">
                      <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="收藏" width={20} height={20} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機卡片（md 以下） */}
      <div className="mt-4 md:hidden flex flex-col gap-3">
        {pageRows.length === 0 ? (
          <div className="py-6 text-center text-[15px] font-['Noto_Sans_TC'] text-black-700 bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
            查無符合條件的教案，請調整檢索條件後再試。
          </div>
        ) : pageRows.map((r) => (
          <div key={r.id} className="bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
            {/* 上區塊 */}
            <div className="px-4 py-2 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                  {r.good && (
                    <>
                      <img src="/icons/good.svg" alt="" width={14} height={14} style={goodTint} className="shrink-0" />
                      <span className="text-[13px] font-semibold font-['Noto_Sans_TC'] text-secondary-700 shrink-0">優良教案</span>
                    </>
                  )}
                  {r.hashtags?.map((tag) => (
                    <span key={tag} className="text-[12px] font-['Noto_Sans_TC'] font-normal text-[#808080]">#{tag}</span>
                  ))}
                </div>
                {mode === 'mine' ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <button type="button" onClick={() => onEdit?.(r)} aria-label="編輯" disabled={!onEdit}
                      className={!onEdit ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}>
                      <img src="/icons/edit.svg" alt="編輯" width={20} height={20} />
                    </button>
                    <button type="button" onClick={() => onDelete?.(r)} aria-label="刪除" disabled={!onDelete}
                      className={!onDelete ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}>
                      <img src="/icons/trash.svg" alt="刪除" width={20} height={20} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => handleToggleLike(r)} aria-label={r.liked ? '取消收藏' : '加入收藏'}
                    className="shrink-0 hover:opacity-70 cursor-pointer">
                    <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="收藏" width={20} height={20} />
                  </button>
                )}
              </div>
              <p className="text-[16px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-snug">{r.title}</p>
            </div>
            {/* 下區塊 */}
            <div className="px-4 py-2 flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/icons/calender.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.issue}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/icons/category.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/icons/home.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.family}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/icons/author.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.author}</span>
                  </div>
                </div>
              </div>
              {mode === 'likes' && (
                <button type="button" onClick={() => onView?.(r)} aria-label="查看" disabled={!onView}
                  className={`w-[64px] h-[26px] rounded-[4px] px-[20px] py-[4px] bg-primary-900 text-white text-[12px] font-normal font-['Noto_Sans_TC'] leading-[150%] whitespace-nowrap shrink-0 inline-flex items-center justify-center ${!onView ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
                  查看
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    {/* === 底部區塊 === */}
      {mode === 'mine' ? (
        // 我的教案：手機/平板直排；桌面三欄（上傳置中、分頁靠右）
        <div className="mt-6 w-full flex flex-col items-center gap-4 md:grid md:grid-cols-3 md:items-center md:gap-0">
          <div className="hidden md:block" /> {/* 桌面佔位 */}

          {/* 上傳教案 */}
          <div className="md:justify-self-center">
            <button
              type="button"
              onClick={() => router.push('/upload')}
              className="
                w-[160px] h-[48px] rounded-[8px] bg-primary-900
                px-[20px] py-[12px] whitespace-nowrap
                text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-bold text-white
                shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] cursor-pointer hover:opacity-90
              "
            >
              上傳教案
            </button>
          </div>

          {/* 分頁 */}
          <div className="md:justify-self-end">
            <div className="h-[36px] flex items-center justify-center md:justify-end gap-2">
              <PageBtn icon="/icons/angle-left-double.svg" disabled={!canPrev} onClick={() => setPage(1)} />
              <PageBtn icon="/icons/angle-left.svg" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} />
              <div className="h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
                第 {pad2(totalPages === 0 ? 0 : page)} 頁
              </div>
              <PageBtn icon="/icons/angle-right.svg" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              <PageBtn icon="/icons/angle-right-double.svg" disabled={!canNext} onClick={() => setPage(totalPages)} />
            </div>
          </div>
        </div>
      ) : (
        // 我的收藏：分頁置中（維持原樣）
        <div className="mt-6 h-[36px] mx-auto flex items-center justify-center gap-2">
          <PageBtn icon="/icons/angle-left-double.svg" disabled={!canPrev} onClick={() => setPage(1)} />
          <PageBtn icon="/icons/angle-left.svg" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} />
          <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
            第 {pad2(totalPages === 0 ? 0 : page)} 頁，共 {pad2(totalPages)} 頁
          </div>
          <PageBtn icon="/icons/angle-right.svg" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
          <PageBtn icon="/icons/angle-right-double.svg" disabled={!canNext} onClick={() => setPage(totalPages)} />
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
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-black-100'}
      `}
    >
      <img src={icon} alt="" width={20} height={20} />
    </button>
  );
}

