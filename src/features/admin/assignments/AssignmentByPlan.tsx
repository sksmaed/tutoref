'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { jobPoints, type SlotMap } from './useAssignmentBoard';
import type { MemberRow, ReviewJobRow } from '@/services/review';

const JOB_STATE_LABEL: Record<string, string> = {
  draft: '待分配',
  assignment_saved: '待分配',
  assignment_published: '待驗收',
  in_review: '驗收中',
  review_closed: '待處理',
  result_locked: '已鎖定',
  result_published: '已完成',
};

interface AssignmentByPlanProps {
  jobs: ReviewJobRow[];
  slots: SlotMap;
  reviewers: MemberRow[];
  editing: boolean;
  onSetSlot: (jobId: string, slot: string, reviewerId: string) => void;
  onAddSlot: (jobId: string) => void;
  onRemoveSlot: (jobId: string, slot: string) => void;
}

/** 依教案檢視：每份教案可依需求增減 reviewer。 */
export const AssignmentByPlan: React.FC<AssignmentByPlanProps> = ({
  jobs,
  slots,
  reviewers,
  editing,
  onSetSlot,
  onAddSlot,
  onRemoveSlot,
}) => {
  const reviewerCell = (job: ReviewJobRow) => {
    const jobSlots = Object.entries(slots[job.id] ?? {}).sort(([a], [b]) => a.localeCompare(b));

    if (!editing) {
      if (jobSlots.length === 0) return <span className="text-status-idle">未指派</span>;
      return (
        <div className="flex flex-wrap justify-center gap-1">
          {jobSlots.map(([slot, reviewerId]) => {
            const reviewer = reviewers.find((item) => item.user_id === reviewerId);
            const conflict = !!reviewer?.family_name && reviewer.family_name === job.family;
            return (
              <span
                key={slot}
                className={`rounded-full bg-black-100 px-2 py-0.5 text-[12px] ${conflict ? 'text-status-alert' : 'text-black-700'}`}
              >
                {reviewer?.name || reviewer?.email || '未知驗收者'}
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {jobSlots.map(([slot, reviewerId]) => {
          const reviewer = reviewers.find((item) => item.user_id === reviewerId);
          const conflict = !!reviewer?.family_name && reviewer.family_name === job.family;
          return (
            <div key={slot} className="flex items-center gap-2">
              <select
                value={reviewerId}
                onChange={(event) => onSetSlot(job.id, slot, event.target.value)}
                className={`min-w-0 flex-1 rounded-lg border px-2 py-1 text-[13px] ${conflict ? 'border-status-alert text-status-alert' : 'border-black-200'}`}
              >
                <option value="">選擇驗收者</option>
                {reviewers.map((item) => (
                  <option key={item.user_id} value={item.user_id}>
                    {item.name || item.email}
                    {item.family_name ? `（${item.family_name}）` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemoveSlot(job.id, slot)}
                className="shrink-0 px-1 text-[13px] text-status-alert hover:opacity-70 hover:cursor-pointer"
                aria-label="移除驗收者"
              >
                移除
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => onAddSlot(job.id)}
          className="self-start text-[13px] text-primary-900 hover:opacity-70 hover:cursor-pointer"
        >
          ＋ 新增驗收者
        </button>
      </div>
    );
  };

  return (
    <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <table className="w-full min-w-[760px] border-collapse text-[14px] font-['Noto_Sans_TC']">
        <thead>
          <tr className="bg-primary-100 font-bold text-black-900">
            <th className="h-[48px] px-4 text-left">教案</th>
            <th className="h-[48px] w-[80px] px-2 text-center">家別</th>
            <th className="h-[48px] w-[70px] px-2 text-center">點數</th>
            <th className="h-[48px] w-[320px] px-2 text-center">驗收者（人數不限）</th>
            <th className="h-[48px] w-[100px] px-2 text-center">狀態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black-200 bg-white">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="h-[80px] text-center text-black-700">
                本輪還沒有任何送件，沒有可分配的教案。
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
                <tr key={job.id} className="transition-colors hover:bg-primary-100">
                  <td className="h-[56px] px-4">
                    <span className="block truncate" title={job.tp_name}>
                      {job.tp_name}
                    </span>
                    <span className="text-[12px] text-black-500">
                      {job.grade}・{job.duration} 分鐘
                    </span>
                  </td>
                  <td className="h-[56px] px-2 text-center">{job.family}</td>
                  <td className="h-[56px] px-2 text-center">{jobPoints(job)}</td>
                  <td className="h-[56px] px-3 py-2 text-center">{reviewerCell(job)}</td>
                  <td className="h-[56px] px-2 text-center">
                    <StatusChip status={JOB_STATE_LABEL[job.job_state] ?? job.job_state} />
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  );
};
