'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchAuthorJobs,
  fetchFeedbackItems,
  updateFeedbackStatus,
  uploadRevisedSheet,
  type AuthorJobRow,
  type FeedbackItemRow,
  type FeedbackStatus,
} from '@/services/review';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';

export function useAuthorReview(round: Round) {
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [jobs, setJobs] = useState<AuthorJobRow[]>([]);
  const [feedback, setFeedback] = useState<Record<string, FeedbackItemRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      const rows = await fetchAuthorJobs(termId, round);
      setJobs(rows);
      // 只有結果已發布的教案才有回饋可看
      const withFeedback = rows.filter((row) => row.feedback_progress.total > 0);
      const lists = await Promise.all(withFeedback.map((row) => fetchFeedbackItems(row.id)));
      setFeedback(Object.fromEntries(withFeedback.map((row, index) => [row.id, lists[index]])));
      setError(null);
    } catch (err) {
      setJobs([]);
      setError(err instanceof Error ? err.message : '無法取得本期教案');
    } finally {
      setLoading(false);
    }
  }, [round, termId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const respond = useCallback(
    async (itemId: string, status: FeedbackStatus, body: string) => {
      setWorking(true);
      try {
        await updateFeedbackStatus(itemId, status, body);
        await reload();
      } finally {
        setWorking(false);
      }
    },
    [reload]
  );

  const uploadSheet = useCallback(
    async (planId: string, file: File) => {
      setWorking(true);
      try {
        return await uploadRevisedSheet(planId, file);
      } finally {
        setWorking(false);
      }
    },
    []
  );

  /** 整體處理進度：上游要求頁面頂部要有「12 則回饋，已處理 9 則」。 */
  const progress = jobs.reduce(
    (total, job) => ({
      total: total.total + job.feedback_progress.total,
      done: total.done + job.feedback_progress.done,
    }),
    { total: 0, done: 0 }
  );

  return { jobs, feedback, loading, error, working, progress, reload, respond, uploadSheet };
}
