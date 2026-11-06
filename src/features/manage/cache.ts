import { readSessionJson, writeSessionJson } from '@/lib/session-cache';
import type { Row as TableRow } from '@/features/teaching-plan/AllPlansTable';

/**
 * 「已上傳教案」（/plans/mine）清單的 sessionStorage 快取。
 * 清單頁自己讀寫；編輯頁與上傳流程存檔後呼叫 updateMineCacheAfterEdit，
 * 讓回到清單時立刻看到新內容，不用等背景重抓。
 */
export const MINE_PLANS_CACHE_KEY = 'plansMine:rowsCache:v1';
export const MINE_TABLE_UI_CACHE_KEY = 'plansMine:tableUiState:v1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDetailToMineRow = (detail: any): Partial<TableRow> & { id: string } => ({
  id: String(detail?.id ?? ''),
  family: detail?.team ?? '',
  issue: `${detail?.academic_year ?? ''}${detail?.semester_period ?? ''}`.trim(),
  category: detail?.category ?? '',
  title: detail?.tp_name ?? '',
  author: detail?.writer_name ?? '',
  good: Boolean(detail?.is_excellent),
  grade: detail?.grade ?? '',
  duration: typeof detail?.duration === 'number' ? detail.duration : undefined,
  hashtags: Array.isArray(detail?.hashtags) ? detail.hashtags : [],
  viewCount: typeof detail?.view_count === 'number' ? detail.view_count : undefined,
  createdAt: detail?.created_at ? Date.parse(String(detail.created_at)) : undefined,
  ...(detail?.updated_at ? { updatedAt: String(detail.updated_at) } : {}),
  ...('sheet_pdf' in (detail ?? {}) ? { hasSheet: !!detail.sheet_pdf } : {}),
  ...('slide_pdf' in (detail ?? {}) ? { hasSlides: !!detail.slide_pdf } : {}),
});

/** 編輯 / 上傳教案存檔後，讓已上傳教案快取中的同一筆立即反映新內容。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateMineCacheAfterEdit = (detail: any) => {
  const nextRow = mapDetailToMineRow(detail);
  if (!nextRow.id) return;

  const cached = readSessionJson<TableRow[]>(MINE_PLANS_CACHE_KEY);
  if (Array.isArray(cached)) {
    writeSessionJson(
      MINE_PLANS_CACHE_KEY,
      cached.map((item) => (item.id === nextRow.id ? { ...item, ...nextRow } : item)),
    );
  }
};
