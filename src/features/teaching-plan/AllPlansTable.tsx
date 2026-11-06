'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { compareIssues } from '@/lib/issues';
import IssueSortDropdown, { ISSUE_SORT_OPTIONS } from '@/features/teaching-plan/IssueSortDropdown';
import { readSessionJson, writeSessionJson } from '@/lib/session-cache';
import { PlanStatusBadges } from '@/features/teaching-plan/PlanStatusBadges';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { TABLE, TABLE_WRAP, TD, TH } from '@/lib/table-styles';
import type {
  TeachingPlanEditingStatus,
  TeachingPlanVisibilityStatus,
} from '@/services/teaching-plan';

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
  editingStatus?: TeachingPlanEditingStatus;
  visibilityStatus?: TeachingPlanVisibilityStatus;
  /** 以下只有「已上傳教案」有；舊快取可能沒有，顯示時要容錯。 */
  hasSheet?: boolean;
  hasSlides?: boolean;
  updatedAt?: string;
  /** 已進入本期驗收流程，不能從這裡編輯。 */
  inReview?: boolean;
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

/** 「最後更新」欄：只顯示月/日 時:分，對齊 v13。 */
export function formatShortDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** 教案紙與投影片都有才算完整；舊快取沒有檔案資訊時顯示 —。 */
export function FileCompleteness({ row }: { row: Row }) {
  if (row.hasSheet === undefined && row.hasSlides === undefined) {
    return <span className="text-black-500">—</span>;
  }
  return row.hasSheet && row.hasSlides ? (
    <StatusChip status="完整" tone="done" />
  ) : (
    <StatusChip status="缺少附件" tone="active" />
  );
}

/**
 * 「已上傳教案」與「已收藏教案」共用的清單（v13 `renderMyLessons()` / `lessonTable()`）。
 * 點整列交給 onView：已上傳開教案小視窗，已收藏開課程詳細資訊。
 */
export function AllPlansTable({
  rowsInput,
  mode,
  uiStateStorageKey,
  onToggleFavorite,
  onView,
}: {
  rowsInput: Row[];
  mode: 'mine' | 'likes';
  /** 提供時，排序／篩選／頁碼會存進 sessionStorage，回到頁面時還原。 */
  uiStateStorageKey?: string;
  onToggleFavorite?: (row: Row, nextLiked: boolean) => Promise<void>;
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

  const columns =
    mode === 'mine'
      ? ['教案', '期別 / 家別', '檔案完整性', '驗收狀態', '最後更新']
      : ['教案名稱', '撰寫者', '類別', '家別', '期數', '年級', '收藏'];

  const likeButton = (r: Row, size = 20) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void handleToggleLike(r);
      }}
      aria-label={r.liked ? '取消收藏' : '加入收藏'}
      className="shrink-0 cursor-pointer rounded-lg p-[6px] hover:bg-primary-100"
    >
      <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={size} height={size} />
    </button>
  );

  const goodBadge = (
    <span className="inline-flex shrink-0 items-center gap-[2px] rounded-full bg-status-done-bg px-2 py-[2px] text-[11px] font-bold text-status-done">
      <img src="/icons/good.svg" alt="" width={12} height={12} style={goodTint} />
      優良
    </span>
  );

  return (
    <section className="w-full">
      {/* 左：筆數；右：優良篩選 + 排序 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-['Noto_Sans_TC'] text-[14px] text-black-500">
          共 <span className="font-bold text-primary-900">{mode === 'likes' ? baseRows.length : rowsInput.length}</span> 份教案
        </p>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={() => setOnlyGood((v) => !v)}
            className={[
              'inline-flex h-[32px] items-center justify-center gap-[3px] whitespace-nowrap rounded-[8px] border bg-white px-[12px] py-[5px]',
              'cursor-pointer shadow-[0_3px_12px_rgba(0,0,0,0.045)]',
              onlyGood ? 'border-secondary-700 text-secondary-700' : 'border-black-200 text-black-900 hover:bg-black-100/60',
            ].join(' ')}
            title="只看優良教案"
          >
            <img src="/icons/good.svg" alt="" width={16} height={16} style={onlyGood ? goodTint : undefined} />
            <span className="font-['Noto_Sans_TC'] text-[14px] leading-[150%]">優良教案</span>
          </button>
          <IssueSortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* 桌機表格（md 以上） */}
      <div className={`mt-4 hidden md:block ${TABLE_WRAP}`}>
        <table className={TABLE}>
          <thead>
            <tr>
              {columns.map((h) => (
                <th key={h} className={`${TH} ${h === '收藏' ? 'text-center' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[15px] text-black-500">
                  {mode === 'likes' ? '目前還沒有收藏教案' : '目前還沒有上傳教案'}
                </td>
              </tr>
            ) : pageRows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onView?.(r)}
                className={`transition-colors hover:bg-primary-100/40 ${onView ? 'cursor-pointer' : ''}`}
              >
                {mode === 'mine' ? (
                  <>
                    <td className={TD}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{r.title}</span>
                        {r.good && goodBadge}
                      </div>
                      <p className="mt-[2px] text-[12px] text-black-500">{r.category || '—'}</p>
                    </td>
                    <td className={`${TD} whitespace-nowrap`}>{[r.issue, r.family].filter(Boolean).join('・') || '—'}</td>
                    <td className={TD}><FileCompleteness row={r} /></td>
                    <td className={TD}>
                      <PlanStatusBadges editingStatus={r.editingStatus} visibilityStatus={r.visibilityStatus} align="start" />
                    </td>
                    <td className={`${TD} whitespace-nowrap text-[12px] text-black-500`}>{formatShortDateTime(r.updatedAt)}</td>
                  </>
                ) : (
                  <>
                    <td className={TD}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{r.title}</span>
                        {r.good && goodBadge}
                      </div>
                    </td>
                    <td className={TD}>{r.author}</td>
                    <td className={TD}>{r.category}</td>
                    <td className={TD}>{r.family}</td>
                    <td className={`${TD} whitespace-nowrap`}>{r.issue}</td>
                    <td className={TD}>{r.grade || '—'}</td>
                    <td className={`${TD} text-center`}>{likeButton(r)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機卡片（md 以下） */}
      <div className="mt-4 flex flex-col gap-3 md:hidden">
        {pageRows.length === 0 ? (
          <div className="rounded-[10px] border border-black-200 bg-white py-6 text-center font-['Noto_Sans_TC'] text-[15px] text-black-500">
            {mode === 'likes' ? '目前還沒有收藏教案' : '目前還沒有上傳教案'}
          </div>
        ) : pageRows.map((r) => (
          <div
            key={r.id}
            onClick={() => onView?.(r)}
            className="cursor-pointer rounded-[10px] border border-black-200 bg-white px-4 py-3 shadow-[0_3px_12px_rgba(0,0,0,0.045)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-['Noto_Sans_TC'] text-[16px] font-bold leading-snug text-black-900">{r.title}</p>
                  {r.good && goodBadge}
                </div>
                <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-500">
                  {[r.issue, r.family, r.category, mode === 'likes' ? r.author : ''].filter(Boolean).join('・')}
                </p>
              </div>
              {mode === 'likes' && likeButton(r)}
            </div>
            {mode === 'mine' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <FileCompleteness row={r} />
                <PlanStatusBadges editingStatus={r.editingStatus} visibilityStatus={r.visibilityStatus} compact />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 分頁 */}
      <div className="mt-6 flex h-[36px] items-center justify-center gap-2 md:justify-end">
        <PageBtn icon="/icons/angle-left-double.svg" disabled={!canPrev} onClick={() => setPage(1)} />
        <PageBtn icon="/icons/angle-left.svg" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <div className="flex h-[24px] items-center justify-center gap-2 px-1 font-['Noto_Sans_TC'] text-[14px]">
          第 {pad2(totalPages === 0 ? 0 : page)} 頁，共 {pad2(totalPages)} 頁
        </div>
        <PageBtn icon="/icons/angle-right.svg" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
        <PageBtn icon="/icons/angle-right-double.svg" disabled={!canNext} onClick={() => setPage(totalPages)} />
      </div>
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

