'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { deadlineState, formatDateTime } from '@/features/review-shared/format';
import type { ScheduleRow } from '@/services/review';

const STAGE_LABEL: Record<string, string> = { initial: '初驗', final: '總驗' };

interface ScheduleBlockProps {
  schedules: ScheduleRow[];
}

/**
 * 公告頁的時程區塊（§6.8）。四個日期全部來自 GET /review/schedules，
 * 前端不自己算、不寫死；未設定就顯示「未設定」，不放假日期。
 */
export const ScheduleBlock: React.FC<ScheduleBlockProps> = ({ schedules }) => {
  const rows = schedules.filter((schedule) => schedule.round_no === 1);
  if (rows.length === 0) return null;

  return (
    <section className="rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <h2 className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">本期時程</h2>
      <div className="mt-3 flex flex-col gap-3">
        {rows.map((schedule) => {
          const submission = deadlineState(schedule.submission_due_at);
          const review = deadlineState(schedule.review_due_at);
          return (
            <div key={schedule.id} className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="w-[40px] font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
                {STAGE_LABEL[schedule.stage] ?? schedule.stage}
              </span>
              <span className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
                送件截止 {formatDateTime(schedule.submission_due_at)}
                {submission.label && (
                  <span className={`ml-2 ${submission.overdue ? 'text-status-alert' : 'text-black-500'}`}>
                    {submission.label}
                  </span>
                )}
              </span>
              <span className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
                驗收截止 {formatDateTime(schedule.review_due_at)}
                {review.label && (
                  <span className={`ml-2 ${review.overdue ? 'text-status-alert' : 'text-black-500'}`}>
                    {review.label}
                  </span>
                )}
              </span>
              {(submission.overdue || review.overdue) && <StatusChip status="已逾期" tone="alert" />}
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        逾期不會被系統擋下，仍可送件與提交，但畫面上會標記。
      </p>
    </section>
  );
};
