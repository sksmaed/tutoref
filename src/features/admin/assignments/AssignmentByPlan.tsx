'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
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
  selected: Set<string>;
  onToggleSelect: (jobId: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onSetSlot: (jobId: string, slot: 'A' | 'B', reviewerId: string) => void;
}

/** 依教案檢視：每份教案固定 A / B 兩個欄位（D2），不是多選 reviewer。 */
export const AssignmentByPlan: React.FC<AssignmentByPlanProps> = ({
  jobs,
  slots,
  reviewers,
  editing,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onSetSlot,
}) => {
  const allChecked = jobs.length > 0 && jobs.every((job) => selected.has(job.id));

  const slotCell = (job: ReviewJobRow, slot: 'A' | 'B') => {
    const reviewerId = slots[job.id]?.[slot] ?? '';
    const reviewer = reviewers.find((item) => item.user_id === reviewerId);
    const conflict = !!reviewer?.family_name && reviewer.family_name === job.family;

    if (!editing) {
      return (
        <span className={conflict ? 'text-status-alert' : ''}>
          {reviewer ? reviewer.name || reviewer.email : <span className="text-status-idle">未指派</span>}
        </span>
      );
    }
    return (
      <select
        value={reviewerId}
        onChange={(event) => onSetSlot(job.id, slot, event.target.value)}
        className={`w-full rounded-lg border px-2 py-1 text-[13px] ${conflict ? 'border-status-alert text-status-alert' : 'border-black-200'}`}
      >
        <option value="">未指派</option>
        {reviewers.map((item) => (
          <option key={item.user_id} value={item.user_id}>
            {item.name || item.email}
            {item.family_name ? `（${item.family_name}）` : ''}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <table className="w-full min-w-[860px] border-collapse text-[14px] font-['Noto_Sans_TC']">
        <thead>
          <tr className="bg-primary-100 font-bold text-black-900">
            <th className="h-[48px] w-[52px] px-2 text-center">
              {editing && (
                <span className="inline-flex justify-center">
                  <Checkbox checked={allChecked} onChange={onToggleSelectAll} label="" />
                </span>
              )}
            </th>
            <th className="h-[48px] px-4 text-left">教案</th>
            <th className="h-[48px] w-[80px] px-2 text-center">家別</th>
            <th className="h-[48px] w-[70px] px-2 text-center">點數</th>
            <th className="h-[48px] w-[190px] px-2 text-center">Reviewer A</th>
            <th className="h-[48px] w-[190px] px-2 text-center">Reviewer B</th>
            <th className="h-[48px] w-[100px] px-2 text-center">狀態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black-200 bg-white">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={7} className="h-[80px] text-center text-black-700">
                本輪還沒有任何送件，沒有可分配的教案。
              </td>
            </tr>
          ) : (
            jobs.map((job) => {
              const missingSlot = !slots[job.id]?.A || !slots[job.id]?.B;
              return (
                <tr
                  key={job.id}
                  className={`transition-colors hover:bg-primary-100 ${missingSlot ? 'bg-status-alert-bg' : ''}`}
                >
                  <td className="h-[56px] px-2 text-center">
                    {editing && (
                      <span className="inline-flex justify-center">
                        <Checkbox
                          checked={selected.has(job.id)}
                          onChange={(next) => onToggleSelect(job.id, next)}
                          label=""
                        />
                      </span>
                    )}
                  </td>
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
                  <td className="h-[56px] px-2 text-center">{slotCell(job, 'A')}</td>
                  <td className="h-[56px] px-2 text-center">{slotCell(job, 'B')}</td>
                  <td className="h-[56px] px-2 text-center">
                    <StatusChip status={JOB_STATE_LABEL[job.job_state] ?? job.job_state} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
