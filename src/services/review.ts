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

/** GET /review/jobs?assigned_to=me 的一列。 */
export interface ReviewJobRow {
  id: string;
  plan_id: string;
  tp_name: string;
  family: string;
  grade: string;
  duration: number;
  job_type: string;
  job_state: string;
  round_no: number;
  sheet_present: boolean;
  slide_present: boolean;
  /** assigned_to=me 才有；其他情況是 null。 */
  my_slot: string | null;
  my_review_state: string | null;
  assignments: {
    id: string;
    slot_label: string;
    reviewer_id: string;
    reviewer_name: string;
    assignment_state: string;
  }[];
}

export interface RubricCheckItem {
  id: string;
  label: string;
  description: string;
  category: string;
  deduction_value: string;
  sort_order: number;
}

export interface RubricSnapshot {
  rubric_kind: string;
  version: number;
  title: string;
  scoring?: {
    base_score: string;
    potential_excellent_threshold: string;
    pass_min_score: string;
    discussion_min_score: string;
  };
  check_items?: RubricCheckItem[];
}

export interface ReviewSubmissionOut {
  id: string;
  review_state: string;
  submission_mode: string;
  overall_comment: string;
  private_note: string;
  checked_items: { check_item_id: string; deduction_value: string; reason: string }[];
  score: string;
  band: string;
}

export interface ReviewWorkspace {
  job: { id: string; job_type: string; job_state: string; round_no: number };
  snapshot: {
    metadata: Record<string, unknown>;
    sheet_drive_url: string;
    slide_drive_url: string;
    sheet_present: boolean;
    slide_present: boolean;
  };
  rubric: RubricSnapshot | null;
  my_slot: string | null;
  my_submission: ReviewSubmissionOut | null;
  show_live_score: boolean;
}

export interface InitialReviewPayload {
  checked_item_ids: string[];
  item_reasons: Record<string, string>;
  overall_comment: string;
  private_note: string;
}

export async function fetchMyReviewJobs(termId: string, stage: Round): Promise<ReviewJobRow[]> {
  const response = await api.get<ReviewJobRow[]>('/review/jobs', {
    params: { term_id: termId, stage, assigned_to: 'me' },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchReviewWorkspace(jobId: string): Promise<ReviewWorkspace> {
  const response = await api.get<ReviewWorkspace>(`/review/jobs/${jobId}/workspace`);
  return response.data;
}

/** 草稿自動存；只在正式提交前有效。 */
export async function saveInitialDraft(
  jobId: string,
  payload: InitialReviewPayload
): Promise<ReviewSubmissionOut> {
  const response = await api.put<ReviewSubmissionOut>(`/review/jobs/${jobId}/initial-draft`, payload);
  return response.data;
}

/** 正式提交；分數由後端算，request 刻意沒有 score 欄位。 */
export async function submitInitialReview(
  jobId: string,
  payload: InitialReviewPayload
): Promise<ReviewSubmissionOut> {
  const response = await api.post<ReviewSubmissionOut>(
    `/review/jobs/${jobId}/initial-submission`,
    payload
  );
  return response.data;
}
