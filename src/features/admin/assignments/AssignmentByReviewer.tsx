'use client';

import React from 'react';
import type { ReviewerLoadRow } from '@/services/review';

interface AssignmentByReviewerProps {
  rows: ReviewerLoadRow[];
}

/** 依驗收者檢視：份數與加權點數，用來看工作量是否平均。 */
export const AssignmentByReviewer: React.FC<AssignmentByReviewerProps> = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <p className="font-['Noto_Sans_TC'] text-[15px] text-black-700">本輪還沒有任何分配。</p>
      </div>
    );
  }

  const maxPoints = Math.max(...rows.map((row) => row.points), 1);

  return (
    <div className="mt-4 flex flex-col gap-3">
      {[...rows]
        .sort((a, b) => b.points - a.points)
        .map((row) => (
          <div
            key={row.reviewer_id}
            className="rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">
                {row.reviewer_name}
              </p>
              <p className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
                {row.job_count} 份・{row.points} 點
              </p>
            </div>
            <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-black-100">
              <div
                className="h-full rounded-full bg-primary-900"
                style={{ width: `${(row.points / maxPoints) * 100}%` }}
              />
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {row.jobs.map((job) => (
                <li
                  key={`${job.job_id}-${job.slot_label}`}
                  className="font-['Noto_Sans_TC'] text-[13px] text-black-700"
                >
                  {job.tp_name}
                  <span className="ml-1 text-black-500">
                    ({job.slot_label}・{job.points})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
};
