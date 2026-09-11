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
  is_excellent: boolean;
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

export interface FinalCheckItem {
  id: string;
  label: string;
  description: string;
  section: string;
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
  final_check_items?: FinalCheckItem[];
}

/** 總驗工作區帶回來的初驗回饋與作者處理狀況。 */
export interface InitialFeedbackRecap {
  body: string;
  status: string;
  responses: string[];
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

export interface OwnFinalRecord {
  sheet_result: string;
  slide_result: string;
  sheet_failed_reason: string;
  slide_failed_reason: string;
  submitted_at: string | null;
}

export interface ReviewWorkspace {
  initial_feedback: InitialFeedbackRecap[];
  /** 總驗才有：自己這一 slot 已送出的判定。 */
  my_record: OwnFinalRecord | null;
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

/* ---------------- 後台：時程 / policy / 分配 ---------------- */

export interface ScheduleRow {
  id: string;
  stage: string;
  round_no: number;
  submission_due_at: string | null;
  review_due_at: string | null;
  note?: string;
  submission_overdue: boolean;
  review_overdue: boolean;
}

export interface ScheduleItemInput {
  stage: string;
  round_no?: number;
  submission_due_at?: string | null;
  review_due_at?: string | null;
  note?: string | null;
}

export interface MemberRow {
  user_id: string;
  email: string;
  name: string;
  family_id: string | null;
  family_name: string | null;
  /** 本期有沒有這個人的家別歸屬紀錄; false 代表他只有角色、還沒分家 */
  has_membership: boolean;
  membership_active: boolean;
  roles: { role: string; scope_type: string; family_id?: string | null; family_name?: string | null }[];
}

export interface ReviewerLoadRow {
  reviewer_id: string;
  reviewer_name: string;
  job_count: number;
  points: number;
  jobs: { job_id: string; tp_name: string; slot_label: string; points: number }[];
}

export interface AssignmentInput {
  job_id: string;
  slot_label: string;
  reviewer_id: string;
}

export async function fetchSchedules(termId: string): Promise<ScheduleRow[]> {
  const response = await api.get<ScheduleRow[]>('/review/schedules', { params: { term_id: termId } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function updateSchedules(
  termId: string,
  items: ScheduleItemInput[]
): Promise<ScheduleRow[]> {
  const response = await api.put<ScheduleRow[]>('/review/schedules', { term_id: termId, items });
  return response.data;
}

export async function fetchPolicy(termId: string): Promise<Record<string, boolean>> {
  const response = await api.get<Record<string, boolean>>(`/organization/terms/${termId}/policy`);
  return response.data;
}

export async function patchPolicy(
  termId: string,
  values: Record<string, boolean>
): Promise<Record<string, boolean>> {
  const response = await api.patch<Record<string, boolean>>(`/organization/terms/${termId}/policy`, {
    values,
  });
  return response.data;
}

/** 後台檢視全部任務（需要 review.manage）。 */
export async function fetchAllJobs(termId: string, stage: Round): Promise<ReviewJobRow[]> {
  const response = await api.get<ReviewJobRow[]>('/review/jobs', {
    params: { term_id: termId, stage },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchReviewerLoad(termId: string, stage: Round): Promise<ReviewerLoadRow[]> {
  const response = await api.get<ReviewerLoadRow[]>('/review/assignments/reviewer-load', {
    params: { term_id: termId, stage },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchMembers(termId: string): Promise<MemberRow[]> {
  const response = await api.get<MemberRow[]>('/organization/members', { params: { term_id: termId } });
  return Array.isArray(response.data) ? response.data : [];
}

/** 分配草稿批次儲存；reviewer 仍看不到，要 publish 之後才看得到。 */
export async function saveAssignments(
  termId: string,
  items: AssignmentInput[]
): Promise<{ saved: number; warnings: { job_id: string; message: string }[] }> {
  const response = await api.put<{ saved: number; warnings: { job_id: string; message: string }[] }>(
    '/review/assignments/bulk',
    { term_id: termId, items }
  );
  return response.data;
}

export async function publishAssignments(
  termId: string,
  stage: Round,
  options: { title?: string; body?: string; send_email?: boolean } = {}
): Promise<unknown> {
  const response = await api.post('/review/assignments/publish', {
    term_id: termId,
    stage,
    ...options,
  });
  return response.data;
}

/* ---------------- 後台：驗收結果 ---------------- */

export interface FinalDecisionOut {
  decision: string;
  result_state: string;
  reason: string;
  decided_at: string | null;
}

export interface FinalRecord {
  sheet_result: string;
  slide_result: string;
  sheet_failed_reason: string;
  slide_failed_reason: string;
}

export interface ResultRow {
  /** 總驗才有：教案紙 / 投影片各自的判定。 */
  records?: { A: FinalRecord | null; B: FinalRecord | null };
  job_id: string;
  plan_id: string;
  tp_name: string;
  family: string;
  score_a: string | null;
  score_b: string | null;
  average: string | null;
  band: string | null;
  job_state: string;
  final_decision: FinalDecisionOut | null;
  feedback_progress: { total: number; todo: number; done: number };
  result_published: boolean;
}

export interface FeedbackItemRow {
  id: string;
  job_id: string;
  body: string;
  status: string;
  reviewer_name?: string | null;
  responses: { body: string; status: string; created_at: string }[];
}

export async function fetchResults(termId: string, stage: Round): Promise<ResultRow[]> {
  const response = await api.get<ResultRow[]>('/review/results', {
    params: { term_id: termId, stage },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function setDecision(
  jobId: string,
  decision: 'passed' | 'remedial',
  options: { reason?: string; force?: boolean } = {}
): Promise<FinalDecisionOut> {
  const response = await api.put<FinalDecisionOut>(`/review/jobs/${jobId}/decision`, {
    decision,
    reason: options.reason ?? '',
    force: options.force ?? false,
  });
  return response.data;
}

export async function confirmDecision(jobId: string): Promise<FinalDecisionOut> {
  const response = await api.post<FinalDecisionOut>(`/review/jobs/${jobId}/decision/confirm`, {});
  return response.data;
}

export async function lockDecision(jobId: string): Promise<FinalDecisionOut> {
  const response = await api.post<FinalDecisionOut>(`/review/jobs/${jobId}/decision/lock`, {});
  return response.data;
}

/** 解鎖需要理由；權限由 policy.leader_can_unlock_result 或 admin 決定。 */
export async function unlockDecision(jobId: string, reason: string): Promise<FinalDecisionOut> {
  const response = await api.post<FinalDecisionOut>(`/review/jobs/${jobId}/decision/unlock`, { reason });
  return response.data;
}

export async function publishResults(
  termId: string,
  stage: Round,
  jobIds: string[],
  options: { title?: string; body?: string; send_email?: boolean } = {}
): Promise<{ announcement_id: string; published_at: string }> {
  const response = await api.post<{ announcement_id: string; published_at: string }>(
    '/review/results/publish',
    { term_id: termId, stage, job_ids: jobIds, ...options }
  );
  return response.data;
}

export async function fetchFeedbackItems(jobId: string): Promise<FeedbackItemRow[]> {
  const response = await api.get<FeedbackItemRow[]>('/review/feedback-items', {
    params: { job_id: jobId },
  });
  return Array.isArray(response.data) ? response.data : [];
}

/* ---------------- 作者端 ---------------- */

export interface AuthorJobRow {
  id: string;
  plan_id: string;
  tp_name: string;
  family: string;
  job_type: string;
  job_state: string;
  round_no: number;
  sheet_present: boolean;
  slide_present: boolean;
  editing_status: string;
  feedback_progress: { total: number; todo: number; done: number };
  result_published: boolean;
  /** 只有結果發布之後才有值。 */
  decision: string | null;
  /** 只有 policy.show_raw_score_to_author 才會出現。 */
  average?: string | null;
}

export type FeedbackStatus = 'todo' | 'changed' | 'partially_changed' | 'not_changed';

export async function fetchAuthorJobs(termId: string, stage: Round): Promise<AuthorJobRow[]> {
  const response = await api.get<AuthorJobRow[]>('/review/jobs', {
    params: { term_id: termId, stage, author: 'me' },
  });
  return Array.isArray(response.data) ? response.data : [];
}

/** 非 todo 的狀態一定要附說明，前端擋一次，後端也擋。 */
export async function updateFeedbackStatus(
  itemId: string,
  status: FeedbackStatus,
  responseBody: string
): Promise<FeedbackItemRow> {
  const response = await api.patch<FeedbackItemRow>(`/review/feedback-items/${itemId}`, {
    status,
    response_body: responseBody,
  });
  return response.data;
}

/** 上傳總驗修改版教案紙；後端排背景工作換 Drive 檔案，舊檔保留給 snapshot。 */
export async function uploadRevisedSheet(planId: string, file: File): Promise<{ message: string }> {
  const form = new FormData();
  form.append('sheet_pdf', file);
  const response = await api.post<{ status: string; message: string }>(
    `/teaching-plan/detail/${planId}/sheet`,
    form
  );
  return response.data;
}

export interface FinalRecordPayload {
  sheet_result: 'passed' | 'failed';
  slide_result: 'passed' | 'failed';
  sheet_failed_reason?: string;
  slide_failed_reason?: string;
}

/** 總驗判定：教案紙 / 投影片各自通過或未通過，未通過必填理由（後端也擋）。 */
export async function submitFinalRecord(jobId: string, payload: FinalRecordPayload): Promise<unknown> {
  const response = await api.post(`/review/jobs/${jobId}/final-record`, payload);
  return response.data;
}

/* ---------------- 後台：成員 / 教案 / 標準 ---------------- */

export interface TermRow {
  id: string;
  label: string;
  academic_year: string;
  semester_period: string;
  is_active: boolean;
  is_readonly: boolean;
}

export interface FamilyRow {
  id: string;
  name: string;
}

export interface MemberUpsertInput {
  email: string;
  name?: string;
  family_id?: string | null;
  roles?: { role: string; family_id?: string | null }[];
}

export interface MemberPatchInput {
  user_id: string;
  membership_active?: boolean | null;
  revoke_roles?: string[];
}

export async function fetchTerms(): Promise<TermRow[]> {
  const response = await api.get<TermRow[]>('/organization/terms');
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchFamilies(): Promise<FamilyRow[]> {
  const response = await api.get<FamilyRow[]>('/organization/families');
  return Array.isArray(response.data) ? response.data : [];
}

export async function upsertMembers(termId: string, members: MemberUpsertInput[]): Promise<MemberRow[]> {
  const response = await api.post<MemberRow[]>('/organization/members', { term_id: termId, members });
  return response.data;
}

export async function patchMembers(termId: string, items: MemberPatchInput[]): Promise<MemberRow[]> {
  const response = await api.patch<MemberRow[]>('/organization/members', { term_id: termId, items });
  return response.data;
}

export async function cloneMembersFromTerm(fromTermId: string, toTermId: string): Promise<unknown> {
  const response = await api.post('/organization/members/clone-from-term', {
    from_term_id: fromTermId,
    to_term_id: toTermId,
  });
  return response.data;
}

export async function setPlanExcellent(planId: string, isExcellent: boolean): Promise<unknown> {
  const response = await api.patch(`/review/plans/${planId}/excellent`, { is_excellent: isExcellent });
  return response.data;
}

/** 後台檢視某一家的教案；家長只拿得到自己家的，教案組可指定 family_id。 */
export async function fetchFamilyPlansFor(familyId: string, stage: Round): Promise<FamilyPlan[]> {
  const response = await api.get<FamilyPlan[]>('/review/family-plans', {
    params: { family_id: familyId, stage },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export interface RubricVersionRow {
  id: string;
  version: number;
  title: string;
  status: string;
  published_at: string | null;
  content_snapshot: RubricSnapshot;
}

export interface RubricRow {
  id: string;
  kind: 'initial' | 'final';
  name: string;
  description: string;
  is_active: boolean;
  versions: RubricVersionRow[];
}

export interface RubricItemInput {
  label: string;
  description?: string;
  category?: string;
  section?: string;
  deduction_value?: number | null;
  sort_order?: number;
}

export async function fetchRubrics(termId: string): Promise<RubricRow[]> {
  const response = await api.get<RubricRow[]>('/review/rubrics', { params: { term_id: termId } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createRubricVersion(payload: {
  rubric_id: string;
  kind: 'initial' | 'final';
  title?: string;
  description?: string;
  items: RubricItemInput[];
  scoring?: Record<string, number> | null;
  activate?: boolean;
}): Promise<unknown> {
  const response = await api.post('/review/rubric-versions', payload);
  return response.data;
}

/**
 * 替還沒有標準的一期開一份 v1。內容沿用上一期的啟用版本, 沒有上一期就用規格預設,
 * 組長不用從零手打二十項。
 */
export async function bootstrapRubric(payload: {
  term_id: string;
  kind: 'initial' | 'final';
}): Promise<RubricRow> {
  const response = await api.post<RubricRow>('/review/rubrics/bootstrap', payload);
  return response.data;
}

/* ---------------- 公告 ---------------- */

export type AnnouncementType =
  | 'general'
  | 'schedule'
  | 'open_assignment'
  | 'publish_initial_result'
  | 'publish_final_result'
  | 'remedial';

export interface AnnouncementRow {
  id: string;
  announcement_type: AnnouncementType;
  title: string;
  body: string;
  audience: string;
  state: string;
  published_at: string | null;
  published_by_name: string | null;
}

export const ANNOUNCEMENT_TYPE_LABEL: Record<AnnouncementType, string> = {
  general: '一般公告',
  schedule: '驗收時程',
  open_assignment: '開放驗收任務',
  publish_initial_result: '初驗結果',
  publish_final_result: '總驗結果',
  remedial: '補驗通知',
};

export async function fetchAnnouncements(params: {
  termId?: string;
  type?: AnnouncementType;
} = {}): Promise<AnnouncementRow[]> {
  const response = await api.get<AnnouncementRow[]>('/review/announcements', {
    params: { term_id: params.termId, announcement_type: params.type },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function publishAnnouncement(payload: {
  term_id: string;
  announcement_type: AnnouncementType;
  title: string;
  body?: string;
  audience?: string;
  send_email?: boolean;
}): Promise<AnnouncementRow> {
  const response = await api.post<AnnouncementRow>('/review/announcements', payload);
  return response.data;
}

export async function fetchAnnouncement(id: string): Promise<AnnouncementRow> {
  const response = await api.get<AnnouncementRow>(`/review/announcements/${id}`);
  return response.data;
}

export interface JobReviewRow {
  slot_label: string;
  reviewer_name: string;
  /** null 代表這一格還沒提交（草稿不算）。 */
  review_state: string | null;
  score: string | null;
  band: string | null;
  overall_comment: string;
  private_note: string;
  checked_items: { label: string; category: string; deduction_value: string; reason: string }[];
  record: FinalRecord | null;
}

/** 教案組看兩位 reviewer 各自寫了什麼；作者端不會用到這支。 */
export async function fetchJobReviews(jobId: string): Promise<JobReviewRow[]> {
  const response = await api.get<JobReviewRow[]>(`/review/jobs/${jobId}/reviews`);
  return Array.isArray(response.data) ? response.data : [];
}
