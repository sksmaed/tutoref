'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchMyReviewJobs, type ReviewJobRow } from '@/services/review';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';

/** 我的驗收任務清單。未發布時後端回空陣列，不是錯誤。enabled=false 時不打 API。 */
export function useReviewTasks(round: Round, enabled = true) {
  const { context } = useTermContext();
  const [jobs, setJobs] = useState<ReviewJobRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const termId = context?.current_term?.id ?? null;

  const reload = useCallback(async () => {
    if (!termId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setJobs(await fetchMyReviewJobs(termId, round));
      setError(null);
    } catch (err) {
      setJobs([]);
      setError(err instanceof Error ? err.message : '無法取得驗收任務');
    } finally {
      setLoading(false);
    }
  }, [enabled, round, termId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, loading, error, reload };
}
