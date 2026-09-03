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

  /**
   * 存完只換掉那一則, 不重抓整頁。
   * 之前是存完就 reload(), loading 一亮整個列表被 spinner 取代 -> 元件卸載 ->
   * 展開狀態與輸入全部歸零, 處理十則回饋就要重新展開十次。
   */
  const respond = useCallback(async (itemId: string, status: FeedbackStatus, body: string) => {
    setWorking(true);
    try {
      const updated = await updateFeedbackStatus(itemId, status, body);
      setFeedback((prev) => {
        const next: Record<string, FeedbackItemRow[]> = {};
        for (const [jobId, items] of Object.entries(prev)) {
          next[jobId] = items.map((item) => (item.id === updated.id ? updated : item));
        }
        return next;
      });
    } finally {
      setWorking(false);
    }
  }, []);

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

  /** 已載入回饋的教案用實際內容算, 其餘沿用後端給的數字, 這樣就地更新後進度才會跟著動。 */
  const jobProgress = useCallback(
    (job: AuthorJobRow) => {
      const items = feedback[job.id];
      if (!items) return job.feedback_progress;
      return {
        total: items.length,
        todo: items.filter((item) => item.status === 'todo').length,
        done: items.filter((item) => item.status !== 'todo').length,
      };
    },
    [feedback]
  );

  /** 整體處理進度：上游要求頁面頂部要有「12 則回饋，已處理 9 則」。 */
  const progress = jobs.reduce(
    (total, job) => {
      const current = jobProgress(job);
      return { total: total.total + current.total, done: total.done + current.done };
    },
    { total: 0, done: 0 }
  );

  return { jobs, feedback, loading, error, working, progress, jobProgress, reload, respond, uploadSheet };
}
