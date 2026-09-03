'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchReviewWorkspace,
  saveInitialDraft,
  submitFinalRecord,
  submitInitialReview,
  type FinalRecordPayload,
  type InitialReviewPayload,
  type ReviewWorkspace,
} from '@/services/review';

const AUTOSAVE_INTERVAL_MS = 30_000;

export interface ReviewFormState {
  checked: Set<string>;
  reasons: Record<string, string>;
  overallComment: string;
  privateNote: string;
}

const EMPTY_FORM: ReviewFormState = {
  checked: new Set(),
  reasons: {},
  overallComment: '',
  privateNote: '',
};

function toPayload(form: ReviewFormState): InitialReviewPayload {
  const ids = [...form.checked];
  return {
    checked_item_ids: ids,
    item_reasons: Object.fromEntries(ids.map((id) => [id, form.reasons[id] ?? '']).filter(([, v]) => v)),
    overall_comment: form.overallComment,
    private_note: form.privateNote,
  };
}

/**
 * 驗收工作區的資料與表單狀態。
 *
 * 草稿每 30 秒或欄位 blur 時存一次（§6.3）——prototype 的「提交後沒儲存到」
 * 就是因為沒有草稿。已提交之後草稿不再適用，改動要走正式提交。
 */
export function useReviewWorkspace(jobId: string) {
  const [workspace, setWorkspace] = useState<ReviewWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  const dirtyRef = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  const submitted = !!workspace?.my_submission && workspace.my_submission.review_state !== 'draft';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReviewWorkspace(jobId);
      setWorkspace(data);
      setForm({
        checked: new Set(data.my_submission?.checked_items.map((item) => item.check_item_id) ?? []),
        reasons: Object.fromEntries(
          (data.my_submission?.checked_items ?? []).map((item) => [item.check_item_id, item.reason])
        ),
        overallComment: data.my_submission?.overall_comment ?? '',
        privateNote: data.my_submission?.private_note ?? '',
      });
      dirtyRef.current = false;
      setError(null);
    } catch (err) {
      setWorkspace(null);
      setError(err instanceof Error ? err.message : '無法取得驗收工作區');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback((patch: Partial<ReviewFormState>) => {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveDraft = useCallback(async () => {
    if (submitted || !dirtyRef.current) return;
    try {
      await saveInitialDraft(jobId, toPayload(formRef.current));
      dirtyRef.current = false;
      setDraftSavedAt(new Date());
    } catch {
      // 自動存失敗不打斷填寫；正式送出時會再檢查一次
    }
  }, [jobId, submitted]);

  useEffect(() => {
    if (submitted) return;
    const timer = window.setInterval(() => void saveDraft(), AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [saveDraft, submitted]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      await submitInitialReview(jobId, toPayload(formRef.current));
      dirtyRef.current = false;
      await load();
    } finally {
      setSubmitting(false);
    }
  }, [jobId, load]);

  const submitFinal = useCallback(
    async (payload: FinalRecordPayload) => {
      setSubmitting(true);
      try {
        await submitFinalRecord(jobId, payload);
        await load();
      } finally {
        setSubmitting(false);
      }
    },
    [jobId, load]
  );

  /** 試算分數：底分減掉勾選項目的扣分。以送出後系統計算為準。 */
  const liveScore = useMemo(() => {
    const scoring = workspace?.rubric?.scoring;
    if (!scoring) return null;
    const base = Number(scoring.base_score);
    const items = workspace?.rubric?.check_items ?? [];
    const deducted = items
      .filter((item) => form.checked.has(item.id))
      .reduce((total, item) => total + Number(item.deduction_value), 0);
    const score = base - deducted;
    const band =
      score > Number(scoring.potential_excellent_threshold)
        ? '潛力優良'
        : score >= Number(scoring.pass_min_score)
          ? '通過'
          : score >= Number(scoring.discussion_min_score)
            ? '待討論'
            : '未通過';
    return { score, band, deducted };
  }, [form.checked, workspace]);

  return {
    workspace,
    loading,
    error,
    form,
    update,
    saveDraft,
    submit,
    submitFinal,
    submitting,
    submitted,
    draftSavedAt,
    liveScore,
    reload: load,
  };
}
