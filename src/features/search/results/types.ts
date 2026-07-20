import { ISSUE_SORT_OPTIONS } from '@/features/teaching-plan/IssueSortDropdown';

export type Filters = {
  categories: Set<string>;
  families: Set<string>;
  issues: Set<string>;   // 例如：'25冬'、'24夏'
  grades: Set<string>;
  durations: Set<string>;
};

export type Row = {
  id: string;
  family: string;        // 家別 → team
  issue: string;         // e.g. '25冬'（academic_year + semester_period）
  category: string;      // 原始類別名稱 → category
  categoryGroup: string; // 類別群組（正規化後）
  title: string;         // 教案名稱 → tp_name
  author: string;        // 撰寫者 → writer_name
  good?: boolean;        // 是否優良 → is_excellent
  liked?: boolean;
  grade?: string;
  duration?: number;
  viewCount?: number;
  searchScore?: number;
  createdAt?: number;
  hashtags?: string[];
};

/** 後端 /teaching-plan/search 回傳的單筆資料形狀。 */
export type SearchPlan = {
  id?: string;
  team?: string;
  academic_year?: string;
  semester_period?: string;
  category?: string;
  tp_name?: string;
  writer_name?: string;
  is_excellent?: boolean;
  grade?: string;
  duration?: number;
  view_count?: number;
  search_score?: number;
  created_at?: string;
  hashtags?: string[];
};

export type IssueSortValue = (typeof ISSUE_SORT_OPTIONS)[number]['value'];

/** 將 good.svg 染成優良教案的綠色（CSS filter）。 */
export const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};
