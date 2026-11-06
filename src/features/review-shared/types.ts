/** 驗收模組共用型別；欄位對齊後端 GET /review/me/context（MeContextOut）。 */

export type Round = 'initial' | 'final';

/** 後端算好的能力字串，前端只做 includes()，不自己推導。 */
export type Capability =
  | 'admin.enter'
  | 'announcement.publish'
  | 'audit.view'
  | 'family.submit'
  | 'plan.author'
  | 'review.manage'
  | 'review.submit'
  | 'rubric.manage';

export interface TermOut {
  id: string;
  label: string;
  academic_year: string;
  semester_period: string;
  is_active: boolean;
  is_readonly: boolean;
}

export interface MembershipOut {
  family_id: string;
  family_name: string;
}

export interface RoleOut {
  role: string;
  family_id?: string | null;
  family_name?: string | null;
}

export interface PolicyOut {
  show_raw_score_to_author: boolean;
  show_deduction_detail_to_author: boolean;
  show_reviewer_name_to_author: boolean;
  parent_can_see_raw_score: boolean;
  reviewer_can_see_author_reply: boolean;
  reviewer_anonymous_to_author: boolean;
  leader_can_edit_rubric: boolean;
  leader_can_view_audit: boolean;
  leader_can_unlock_result: boolean;
  leader_can_edit_schedule: boolean;
  leader_can_reopen_submission: boolean;
  coauthor_can_edit: boolean;
  coauthor_can_delete: boolean;
  remedial_frontend_enabled: boolean;
  final_reuses_initial_reviewers: boolean;
  reviewer_can_edit_after_submit: boolean;
  show_live_score_to_reviewer: boolean;
}

export interface StageStateOut {
  assignment_published?: boolean;
  result_published?: boolean;
  submission_due_at?: string | null;
  review_due_at?: string | null;
}

export interface StageStatesOut {
  initial: StageStateOut;
  final: StageStateOut;
}

export interface TermContext {
  current_term?: TermOut | null;
  membership?: MembershipOut | null;
  roles: RoleOut[];
  capabilities: Capability[];
  policy?: PolicyOut | null;
  stage_state: StageStatesOut;
}
