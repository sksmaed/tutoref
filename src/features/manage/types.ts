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
  liked?: boolean;
  good?: boolean;
  grade?: string;
  duration?: number;
  hashtags?: string[];
  editingStatus?: TeachingPlanEditingStatus;
  visibilityStatus?: TeachingPlanVisibilityStatus;
};

export type MyTeachingPlanItem = {
  id: string;
  team?: string;
  academic_year?: string;
  semester_period?: string;
  category?: string;
  tp_name?: string;
  writer_name?: string;
  grade?: string;
  duration?: number;
  is_excellent?: boolean;
  hashtags?: string[];
  editing_status?: TeachingPlanEditingStatus;
  visibility_status?: TeachingPlanVisibilityStatus;
};

export type FavoriteItem = {
  id: string;
  team?: string;
  academic_year?: string;
  semester_period?: string;
  category?: string;
  tp_name?: string;
  writer_name?: string;
  grade?: string;
  duration?: number;
  is_excellent?: boolean;
  hashtags?: string[];
};

export type MyTeachingPlansResponse = {
  data?: MyTeachingPlanItem[];
};

export type FavoritesResponse = {
  data?: FavoriteItem[];
};

/** 將 good.svg 染成優良教案的綠色（CSS filter）。 */
export const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};
