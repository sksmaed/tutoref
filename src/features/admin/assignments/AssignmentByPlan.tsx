'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
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
  /** 某份教案的某個 slot 是否已提交（後端 assignments[].submitted）。 */
  isSlotDone: (jobId: string, slot: string) => boolean;
  onSetSlot: (jobId: string, slot: string, reviewerId: string) => void;
  onAddSlot: (jobId: string) => void;
  onRemoveSlot: (jobId: string, slot: string) => void;
}

/** 從教案檢視（v13 `assignmentLessonView()`）：每份教案可依需求增減驗收者。 */
export const AssignmentByPlan: React.FC<AssignmentByPlanProps> = ({
  jobs,
  slots,
  reviewers,
  editing,
  isSlotDone,
  onSetSlot,
  onAddSlot,
  onRemoveSlot,
}) => {
  const reviewerCell = (job: ReviewJobRow) => {
    const jobSlots = Object.entries(slots[job.id] ?? {}).sort(([a], [b]) => a.localeCompare(b));

    if (!editing) {
      if (jobSlots.length === 0) return <span className="text-status-idle">未指派</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {jobSlots.map(([slot, reviewerId]) => {
            const reviewer = reviewers.find((item) => item.user_id === reviewerId);
            const conflict = !!reviewer?.family_name && reviewer.family_name === job.family;
            return (
              <span
                key={slot}
                className={`rounded-lg bg-black-100 px-2 py-[5px] text-[12px] ${conflict ? 'text-status-alert' : 'text-black-700'}`}
                title={conflict ? '分到自家教案' : undefined}
              >
                <span className="text-black-500">{slot}・</span>
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
              <span className="w-[18px] shrink-0 text-[12px] text-black-500">{slot}</span>
              <select
                value={reviewerId}
                onChange={(event) => onSetSlot(job.id, slot, event.target.value)}
                className={`min-w-0 flex-1 rounded-[10px] border px-2 py-[6px] text-[13px] ${conflict ? 'border-status-alert text-status-alert' : 'border-black-200'}`}
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
                className="shrink-0 cursor-pointer px-1 text-[13px] text-status-alert hover:opacity-70"
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
          className="cursor-pointer self-start text-[13px] font-bold text-primary-900 hover:opacity-70"
        >
          ＋ 新增驗收者
        </button>
      </div>
    );
  };

  return (
    <div className={TABLE_WRAP}>
      <table className={`${TABLE} min-w-[820px]`}>
        <thead>
          <tr>
            <th className={TH}>教案</th>
            <th className={TH}>家別</th>
            <th className={TH}>點數</th>
            <th className={`${TH} w-[340px]`}>驗收者（人數不限）</th>
            <th className={TH}>驗收進度</th>
            <th className={TH}>狀態</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-[14px] text-black-500">
                本輪還沒有任何送件，沒有可分配的教案。
              </td>
            </tr>
          ) : (
            jobs.map((job) => {
              const assigned = Object.entries(slots[job.id] ?? {}).filter(([, id]) => id);
              const done = assigned.filter(([slot]) => isSlotDone(job.id, slot)).length;
              return (
                <tr key={job.id} className={TR}>
                  <td className={TD}>
                    <p className="font-bold">{job.tp_name}</p>
                    <p className="mt-[2px] text-[12px] text-black-500">
                      {job.grade}・{job.duration} 分鐘
                    </p>
                  </td>
                  <td className={TD}>{job.family}</td>
                  <td className={TD}>{jobPoints(job)}</td>
                  <td className={TD}>{reviewerCell(job)}</td>
                  <td className={`${TD} whitespace-nowrap`}>
                    {assigned.length ? `${done} / ${assigned.length} 完成` : '—'}
                  </td>
                  <td className={TD}>
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
