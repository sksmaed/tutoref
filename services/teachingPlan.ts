import { api } from '@/lib/api';
import { normalizeCategory } from '@/lib/categories';

export interface TeachingPlanSummary {
  id: string;
  tp_name: string;
  writer_name: string;
  team: string;
  academic_year: string;
  semester_period: string;
  category: string;
  category_group?: string;
  grade: string;
  duration: number;
  is_excellent: boolean;
}

export interface TeachingPlanDetail extends TeachingPlanSummary {
  objectives: string;
  outline: string;
  content: string;
  post_class_notes: string;
  slide_pdf?: string | null;
  sheet_pdf?: string | null;
  created_at: string;
  updated_at: string;
}

interface FavoritesResponse {
  status: string;
  count: number;
  data: TeachingPlanSummary[];
  message: string;
}

interface MyPlansResponse {
  status: string;
  count: number;
  data: TeachingPlanDetail[];
  message: string;
}

export async function fetchFavorites(): Promise<TeachingPlanSummary[]> {
  const { data } = await api.get<FavoritesResponse>('/teaching-plan/favorites');
  return Array.isArray(data?.data)
    ? data.data.map((plan) => ({
        ...plan,
        category: plan.category ?? '',
        category_group: normalizeCategory(plan.category),
      }))
    : [];
}

export async function fetchMyTeachingPlans(): Promise<TeachingPlanDetail[]> {
  const { data } = await api.get<MyPlansResponse>('/teaching-plan/my-teaching-plans');
  return Array.isArray(data?.data)
    ? data.data.map((plan) => ({
        ...plan,
        category: plan.category ?? '',
        category_group: normalizeCategory(plan.category),
      }))
    : [];
}

export async function fetchTeachingPlanDetail(planId: string): Promise<TeachingPlanDetail> {
  const { data } = await api.get<TeachingPlanDetail>(`/teaching-plan/detail/${planId}`);
  if (!data) {
    throw new Error('無法取得教案詳情');
  }
  return {
    ...data,
    category: data.category ?? '',
    category_group: normalizeCategory(data.category),
  };
}

export async function addFavorite(planId: string): Promise<void> {
  await api.post(`/teaching-plan/${planId}/favorite`);
}

export async function removeFavorite(planId: string): Promise<void> {
  await api.delete(`/teaching-plan/${planId}/favorite`);
}
