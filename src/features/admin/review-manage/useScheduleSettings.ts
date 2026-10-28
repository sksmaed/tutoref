'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTermContext } from '@/features/review-shared/useTermContext';
import {
  fetchPolicy,
  fetchSchedules,
  patchPolicy,
  updateSchedules,
  type ScheduleItemInput,
  type ScheduleRow,
} from '@/services/review';

/** 驗收時程分頁與「編輯時程」視窗共用的資料。 */
export function useScheduleSettings() {
  const { context, reload: reloadContext } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [policy, setPolicy] = useState<Record<string, boolean> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!termId) return;
    void fetchSchedules(termId).then(setSchedules).catch(() => setSchedules([]));
    void fetchPolicy(termId).then(setPolicy).catch(() => setPolicy(null));
  }, [termId]);

  const saveSchedules = useCallback(
    async (items: ScheduleItemInput[]) => {
      if (!termId) return;
      setSaving(true);
      try {
        setSchedules(await updateSchedules(termId, items));
        await reloadContext();
      } finally {
        setSaving(false);
      }
    },
    [reloadContext, termId]
  );

  const togglePolicy = useCallback(
    async (key: string, value: boolean) => {
      if (!termId) return;
      setSaving(true);
      try {
        setPolicy(await patchPolicy(termId, { [key]: value }));
        await reloadContext();
      } finally {
        setSaving(false);
      }
    },
    [reloadContext, termId]
  );

  return { schedules, policy, saving, saveSchedules, togglePolicy };
}
