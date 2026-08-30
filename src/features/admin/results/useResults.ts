'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  confirmDecision,
  fetchResults,
  lockDecision,
  publishResults,
  setDecision,
  unlockDecision,
  type ResultRow,
} from '@/services/review';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';

export interface BulkFailure {
  jobId: string;
  tpName: string;
  message: string;
}

export function useResults(round: Round) {
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      setRows(await fetchResults(termId, round));
      setError(null);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : '無法取得驗收結果');
    } finally {
      setLoading(false);
    }
  }, [round, termId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * 判定 → 確認 → 鎖定，一列一條龍。
   * 後端是三個狀態（draft / confirmed / locked），中間狀態對使用者沒有意義，
   * 所以 UI 只有一個「確認並鎖定結果」，失敗時逐列回報。
   */
  const applyDecision = useCallback(
    async (
      jobs: ResultRow[],
      decision: 'passed' | 'remedial',
      options: { reason?: string; force?: boolean } = {}
    ): Promise<BulkFailure[]> => {
      setWorking(true);
      const failures: BulkFailure[] = [];
      try {
        for (const job of jobs) {
          try {
            await setDecision(job.job_id, decision, options);
            await confirmDecision(job.job_id);
            await lockDecision(job.job_id);
          } catch (err) {
            failures.push({
              jobId: job.job_id,
              tpName: job.tp_name,
              message: err instanceof Error ? err.message : '未知錯誤',
            });
          }
        }
        await reload();
      } finally {
        setWorking(false);
      }
      return failures;
    },
    [reload]
  );

  const publish = useCallback(
    async (jobs: ResultRow[], title: string) => {
      if (!termId) return;
      setWorking(true);
      try {
        await publishResults(
          termId,
          round,
          jobs.map((job) => job.job_id),
          { title }
        );
        await reload();
      } finally {
        setWorking(false);
      }
    },
    [reload, round, termId]
  );

  const unlock = useCallback(
    async (jobId: string, reason: string) => {
      setWorking(true);
      try {
        await unlockDecision(jobId, reason);
        await reload();
      } finally {
        setWorking(false);
      }
    },
    [reload]
  );

  return { rows, loading, error, working, reload, applyDecision, publish, unlock };
}
