import { api } from '@/lib/api';
import type { Round } from '@/features/review-shared/types';

/** GET /review/family-plans 的一列。 */
export interface FamilyPlan {
  plan_id: string;
  tp_name: string;
  writer_names: string[];
  category: string;
  grade: string;
  duration: number;
  sheet_present: boolean;
  slide_present: boolean;
  editing_status: string;
  included: boolean;
  snapshot: {
    submitted_at: string;
    sheet_present: boolean;
    slide_present: boolean;
  } | null;
  job_state: string | null;
}

/** GET /review/family-submissions 的一列。 */
export interface FamilySubmissionProgress {
  family_id: string;
  family_name: string;
  stage: string;
  submitted: boolean;
  submitted_at: string | null;
  snapshot_count: number;
  missing_total: number;
}

export interface MissingItem {
  author_id?: string | null;
  missing_count: number;
  reason?: string;
}

export interface FamilySubmissionPayload {
  term_id: string;
  family_id: string;
  stage: Round;
  plan_ids: string[];
  missing: MissingItem[];
  note?: string;
}

export async function fetchFamilyPlans(stage: Round): Promise<FamilyPlan[]> {
  const response = await api.get<FamilyPlan[]>('/review/family-plans', { params: { stage } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchFamilySubmissions(stage: Round): Promise<FamilySubmissionProgress[]> {
  const response = await api.get<FamilySubmissionProgress[]>('/review/family-submissions', {
    params: { stage },
  });
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * 正式送件。不可逆，且本期沒有補件流程（D3），
 * 所以一定要帶 Idempotency-Key，而且同一次操作重試要沿用同一把（§5.3）。
 */
export async function submitFamilyRound(
  payload: FamilySubmissionPayload,
  idempotencyKey: string
): Promise<unknown> {
  const response = await api.post('/review/family-submissions', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.data;
}
