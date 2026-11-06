'use client';

import React, { useEffect, useState } from 'react';
import { BTN_PRIMARY } from '@/lib/button-styles';
import { fromDateTimeLocal, toDateTimeLocal } from '@/features/review-shared/format';
import type { ScheduleItemInput, ScheduleRow } from '@/services/review';

const STAGES: { stage: 'initial' | 'final'; label: string }[] = [
  { stage: 'initial', label: '初驗' },
  { stage: 'final', label: '總驗' },
];

interface ScheduleSettingsProps {
  schedules: ScheduleRow[];
  saving: boolean;
  onSave: (items: ScheduleItemInput[]) => Promise<void>;
}

/**
 * D4：每輪 deadline 可隨時改（含任務已發布後），逾期不擋，只標記。
 * 未設定就顯示空白，不要塞假日期。
 */
export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ schedules, saving, onSave }) => {
  const [draft, setDraft] = useState<Record<string, { submission: string; review: string }>>({});

  useEffect(() => {
    const next: Record<string, { submission: string; review: string }> = {};
    for (const { stage } of STAGES) {
      const row = schedules.find((item) => item.stage === stage && item.round_no === 1);
      next[stage] = {
        submission: toDateTimeLocal(row?.submission_due_at),
        review: toDateTimeLocal(row?.review_due_at),
      };
    }
    setDraft(next);
  }, [schedules]);

  const handleSave = () =>
    onSave(
      STAGES.map(({ stage }) => ({
        stage,
        round_no: 1,
        submission_due_at: fromDateTimeLocal(draft[stage]?.submission ?? ''),
        review_due_at: fromDateTimeLocal(draft[stage]?.review ?? ''),
      }))
    );

  return (
    <section>
      <h3 className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">時程</h3>
      <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700">
        改動後前台立即生效。逾期不擋，家長仍可送件、reviewer 仍可提交，畫面只會標記。
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {STAGES.map(({ stage, label }) => (
          <div key={stage} className="flex flex-wrap items-end gap-4 rounded-xl border border-black-200 px-4 py-3">
            <span className="w-[48px] font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
              {label}
            </span>
            <label className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
              送件截止
              <input
                type="datetime-local"
                value={draft[stage]?.submission ?? ''}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    [stage]: { ...prev[stage], submission: event.target.value },
                  }))
                }
                className="mt-1 block rounded-[10px] border border-black-200 px-3 py-[6px] text-[14px]"
              />
            </label>
            <label className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
              驗收截止
              <input
                type="datetime-local"
                value={draft[stage]?.review ?? ''}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    [stage]: { ...prev[stage], review: event.target.value },
                  }))
                }
                className="mt-1 block rounded-[10px] border border-black-200 px-3 py-[6px] text-[14px]"
              />
            </label>
          </div>
        ))}
      </div>

      <button type="button" onClick={handleSave} disabled={saving} className={`${BTN_PRIMARY} mt-4`}>
        {saving ? '儲存中…' : '儲存時程'}
      </button>
    </section>
  );
};
