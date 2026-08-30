'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchFamilyPlans,
  fetchFamilySubmissions,
  submitFamilyRound,
  type FamilyPlan,
  type FamilySubmissionProgress,
  type MissingItem,
} from '@/services/review';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';

export interface FamilyReviewData {
  plans: FamilyPlan[];
  progress: FamilySubmissionProgress | null;
}

/**
 * 家內驗收清單的資料來源。
 *
 * 驗收資料一律不進 sessionStorage（§5.1）——多人同時操作，過期快取會讓人做錯決定。
 * mutation 之後一律 reload()，不手動 patch local state（§5.2）。
 */
export function useFamilyReview(round: Round) {
  const { context } = useTermContext();
  const [data, setData] = useState<FamilyReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 同一次送出操作重試時沿用同一把 key；成功後才丟掉（§5.3）
  const idempotencyKeyRef = useRef<string | null>(null);

  const familyId = context?.membership?.family_id ?? null;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [plans, submissions] = await Promise.all([
        fetchFamilyPlans(round),
        fetchFamilySubmissions(round),
      ]);
      const progress =
        submissions.find((row) => (familyId ? row.family_id === familyId : true) && row.submitted) ??
        submissions[0] ??
        null;
      setData({ plans, progress });
      setError(null);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : '無法取得家內驗收清單');
    } finally {
      setLoading(false);
    }
  }, [familyId, round]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = useCallback(
    async (planIds: string[], missing: MissingItem[], note = '') => {
      const termId = context?.current_term?.id;
      if (!termId || !familyId) throw new Error('缺少期別或家別資訊，請重新整理後再試。');

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      setSubmitting(true);
      try {
        await submitFamilyRound(
          { term_id: termId, family_id: familyId, stage: round, plan_ids: planIds, missing, note },
          idempotencyKeyRef.current
        );
        idempotencyKeyRef.current = null;
        await reload();
      } finally {
        setSubmitting(false);
      }
    },
    [context, familyId, reload, round]
  );

  return { data, loading, error, submitting, reload, submit };
}
