import { readSessionJson, writeSessionJson } from '@/lib/session-cache';
import type { Row as ManageRow } from './types';
import type { Row as TableRow } from '@/features/teaching-plan/AllPlansTable';
import { formatIssue } from './helpers';

/**
 * 教案管理相關頁面（/manage、/plans/mine、/plans/[id]/edit）共用的 sessionStorage 快取。
 * 三頁各自維護快取但互相同步：刪除、編輯後都要讓另一頁的快取跟上。
 */
export const MY_PLANS_CACHE_KEY = 'manage:myPlansCache:v1';
export const MY_LIKES_CACHE_KEY = 'manage:myLikesCache:v1';
export const LIKES_STATE_CACHE_KEY = 'manage:likesStateCache:v1';
export const MINE_PLANS_CACHE_KEY = 'plansMine:rowsCache:v1';
export const MINE_TABLE_UI_CACHE_KEY = 'plansMine:tableUiState:v1';

export const buildLikesMapFromRows = (rows: ManageRow[]) =>
  Object.fromEntries(rows.map((row) => [row.id, true]));

/** 從 mine 頁刪除教案後，同步移除 manage 頁快取中的同一筆。 */
export const removePlanIdFromManageCaches = (planId: string) => {
  const manageMyPlans = readSessionJson<ManageRow[]>(MY_PLANS_CACHE_KEY);
  if (Array.isArray(manageMyPlans)) {
    writeSessionJson(
      MY_PLANS_CACHE_KEY,
      manageMyPlans.filter((item) => item.id !== planId),
    );
  }

  const manageMyLikes = readSessionJson<ManageRow[]>(MY_LIKES_CACHE_KEY);
  if (Array.isArray(manageMyLikes)) {
    writeSessionJson(
      MY_LIKES_CACHE_KEY,
      manageMyLikes.filter((item) => item.id !== planId),
    );
  }

  const likesState = readSessionJson<Record<string, boolean>>(LIKES_STATE_CACHE_KEY);
  if (likesState && typeof likesState === 'object') {
    const nextLikesState = { ...likesState };
    delete nextLikesState[planId];
    writeSessionJson(LIKES_STATE_CACHE_KEY, nextLikesState);
  }
};

const mapDetailToManageRow = (detail: any): ManageRow => ({
  id: String(detail?.id ?? ''),
  family: detail?.team ?? '',
  issue: formatIssue(detail?.academic_year, detail?.semester_period),
  category: detail?.category ?? '',
  title: detail?.tp_name ?? '',
  author: detail?.writer_name ?? '',
  good: Boolean(detail?.is_excellent),
  grade: detail?.grade ?? '',
  duration: typeof detail?.duration === 'number' ? detail.duration : undefined,
  hashtags: Array.isArray(detail?.hashtags) ? detail.hashtags : [],
});

const mapDetailToMineRow = (detail: any): TableRow => ({
  ...mapDetailToManageRow(detail),
  liked: false,
  viewCount: typeof detail?.view_count === 'number' ? detail.view_count : undefined,
  createdAt: detail?.created_at ? Date.parse(String(detail.created_at)) : undefined,
});

/** 編輯教案儲存成功後，讓 manage / mine 頁快取中的同一筆立即反映新內容。 */
export const updateManageCachesAfterEdit = (detail: any) => {
  const nextRow = mapDetailToManageRow(detail);
  const nextMineRow = mapDetailToMineRow(detail);
  if (!nextRow.id) return;

  const cachedMyPlans = readSessionJson<ManageRow[]>(MY_PLANS_CACHE_KEY);
  if (Array.isArray(cachedMyPlans)) {
    writeSessionJson(
      MY_PLANS_CACHE_KEY,
      cachedMyPlans.map((item) => (item.id === nextRow.id ? { ...item, ...nextRow } : item)),
    );
  }

  const cachedMyLikes = readSessionJson<ManageRow[]>(MY_LIKES_CACHE_KEY);
  if (Array.isArray(cachedMyLikes)) {
    writeSessionJson(
      MY_LIKES_CACHE_KEY,
      cachedMyLikes.map((item) =>
        item.id === nextRow.id ? { ...item, ...nextRow, liked: true } : item,
      ),
    );
  }

  const cachedMinePlans = readSessionJson<TableRow[]>(MINE_PLANS_CACHE_KEY);
  if (Array.isArray(cachedMinePlans)) {
    writeSessionJson(
      MINE_PLANS_CACHE_KEY,
      cachedMinePlans.map((item) =>
        item.id === nextMineRow.id ? { ...item, ...nextMineRow } : item,
      ),
    );
  }
};
