'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { deadlineState, formatDateTime } from '@/features/review-shared/format';
import type { ScheduleRow } from '@/services/review';

interface ScheduleBlockProps {
  termLabel?: string;
  schedules: ScheduleRow[];
}

interface TimelineItem {
  key: string;
  label: string;
  hint?: string;
  dueAt: string | null;
}

/**
 * 公告頁右側的驗收時程（v13 `.timeline`，§6.8）。日期全部來自 GET /review/schedules，
 * 前端不自己算、不寫死；未設定就顯示「未設定」，不放假日期。
 */
export const ScheduleBlock: React.FC<ScheduleBlockProps> = ({ termLabel, schedules }) => {
  const byStage = (stage: string) =>
    schedules.find((schedule) => schedule.stage === stage && schedule.round_no === 1);
  const initial = byStage('initial');
  const final = byStage('final');

  const items: TimelineItem[] = [
    {
      key: 'initial-submission',
      label: '初驗繳交截止',
      hint: '教案紙與投影片需完整上傳，家長送出驗收。',
      dueAt: initial?.submission_due_at ?? null,
    },
    { key: 'initial-review', label: '初驗截止', dueAt: initial?.review_due_at ?? null },
    { key: 'final-submission', label: '修改版繳交截止', dueAt: final?.submission_due_at ?? null },
    { key: 'final-review', label: '總驗截止', dueAt: final?.review_due_at ?? null },
  ];

  return (
    <Card>
      <CardHeader title={`${termLabel ? `${termLabel} ` : ''}驗收時程`} />
      <ol className="relative pl-6 before:absolute before:bottom-1 before:left-[7px] before:top-[6px] before:w-[2px] before:bg-black-200">
        {items.map((item) => {
          const state = deadlineState(item.dueAt);
          return (
            <li
              key={item.key}
              className="relative pb-[18px] last:pb-0 before:absolute before:left-[-21px] before:top-[5px] before:h-[9px] before:w-[9px] before:rounded-full before:bg-primary-900 before:shadow-[0_0_0_4px_var(--color-primary-100)]"
            >
              <p className="font-['Noto_Sans_TC'] text-[11px] text-black-500">
                {formatDateTime(item.dueAt)}
                {state.label && (
                  <span className={`ml-2 ${state.overdue ? 'text-status-alert' : ''}`}>{state.label}</span>
                )}
              </p>
              <p className="mt-1 flex items-center gap-2 font-['Noto_Sans_TC'] text-[14px] font-bold text-black-900">
                {item.label}
                {state.overdue && <StatusChip status="已逾期" tone="alert" />}
              </p>
              {item.hint && <p className="mt-[2px] font-['Noto_Sans_TC'] text-[12px] text-black-500">{item.hint}</p>}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        逾期不會被系統擋下，仍可送件與提交，但畫面上會標記。
      </p>
    </Card>
  );
};
