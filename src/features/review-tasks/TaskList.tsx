'use client';

import React from 'react';
import Link from 'next/link';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { deadlineState, formatDateTime } from '@/features/review-shared/format';
import type { ReviewJobRow } from '@/services/review';

const REVIEW_STATE_LABEL: Record<string, string> = {
  draft: '草稿',
  submitted: '已完成',
  edited: '已完成',
  voided: '未通過',
};

/** 我在這份任務上的進度；沒有 submission 就是還沒開始。 */
export function taskStatusLabel(job: ReviewJobRow): string {
  if (!job.my_review_state) return '待驗收';
  return REVIEW_STATE_LABEL[job.my_review_state] ?? '驗收中';
}

/**
 * 這份任務還需不需要我動手。submitted / edited 代表我已經送出驗收結果;
 * voided 是我的結果被作廢 (例如重新指派), 要重做, 所以算待處理。
 */
export function isPending(job: ReviewJobRow): boolean {
  return job.my_review_state !== 'submitted' && job.my_review_state !== 'edited';
}

interface TaskListProps {
  jobs: ReviewJobRow[];
  /** 本輪的驗收截止日，來自 /review/me/context。 */
  reviewDueAt?: string | null;
  /** 本期政策是否允許 reviewer 送出後再改；決定「已完成」區的說明文字。 */
  canEditAfterSubmit?: boolean;
}

const TaskTable: React.FC<TaskListProps> = ({ jobs, reviewDueAt }) => {
  const due = deadlineState(reviewDueAt);

  return (
    <div className="mt-3 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <table className="w-full min-w-[820px] border-collapse text-[14px] font-['Noto_Sans_TC']">
        <thead>
          <tr className="bg-primary-100 font-bold text-black-900">
            <th className="h-[48px] px-4 text-left">教案</th>
            <th className="h-[48px] w-[90px] px-2 text-center">家別</th>
            <th className="h-[48px] w-[70px] px-2 text-center">Slot</th>
            <th className="h-[48px] w-[150px] px-2 text-center">檔案完整性</th>
            <th className="h-[48px] w-[170px] px-2 text-center">Deadline</th>
            <th className="h-[48px] w-[100px] px-2 text-center">任務狀態</th>
            <th className="h-[48px] w-[90px] px-2 text-center">動作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black-200 bg-white">
          {jobs.map((job) => (
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
              <td className="h-[56px] px-2 text-center">{job.my_slot ?? '—'}</td>
              <td className="h-[56px] px-2 text-center">
                <span className="flex items-center justify-center gap-2 text-[13px]">
                  <span className={job.sheet_present ? 'text-status-done' : 'text-status-alert'}>
                    {job.sheet_present ? '✓' : '✗'} 教案紙
                  </span>
                  <span className={job.slide_present ? 'text-status-done' : 'text-status-alert'}>
                    {job.slide_present ? '✓' : '✗'} 投影片
                  </span>
                </span>
              </td>
              <td className={`h-[56px] px-2 text-center ${due.overdue ? 'text-status-alert' : ''}`}>
                {reviewDueAt ? (
                  <>
                    <span className="block text-[13px]">{formatDateTime(reviewDueAt)}</span>
                    <span className="block text-[12px]">{due.label}</span>
                  </>
                ) : (
                  <span className="text-[13px] text-black-500">未設定</span>
                )}
              </td>
              <td className="h-[56px] px-2 text-center">
                <StatusChip status={taskStatusLabel(job)} />
              </td>
              <td className="h-[56px] px-2 text-center">
                <Link
                  href={`/review/tasks/${job.id}`}
                  className="text-primary-900 hover:opacity-80"
                >
                  進入驗收
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TaskList: React.FC<TaskListProps> = ({ jobs, reviewDueAt, canEditAfterSubmit }) => {
  const pending = jobs.filter(isPending);
  const finished = jobs.filter((job) => !isPending(job));

  if (jobs.length === 0) {
    return (
      <div className="mt-6 rounded-lg bg-white px-6 py-12 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <p className="font-['Noto_Sans_TC'] text-[16px] text-black-900">本輪任務尚未開放</p>
        <p className="mt-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
          教案組發布分配之後，你被指派的教案就會出現在這裡。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <section>
        <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
          待處理<span className="ml-1 text-black-700">({pending.length})</span>
        </h3>
        {pending.length === 0 ? (
          <p className="mt-2 rounded-lg bg-white px-5 py-6 text-center font-['Noto_Sans_TC'] text-[14px] text-black-700 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
            這一輪的任務都完成了。
          </p>
        ) : (
          <TaskTable jobs={pending} reviewDueAt={reviewDueAt} />
        )}
      </section>

      {finished.length > 0 && (
        <section className="mt-8">
          <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
            已完成<span className="ml-1 text-black-700">({finished.length})</span>
          </h3>
          <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-500">
            {canEditAfterSubmit
              ? '本期開放送出後修改，任務鎖定前都還可以回去改。'
              : '本期不開放送出後修改，如需更正請找教案組。'}
          </p>
          <TaskTable jobs={finished} reviewDueAt={reviewDueAt} />
        </section>
      )}
    </div>
  );
};
