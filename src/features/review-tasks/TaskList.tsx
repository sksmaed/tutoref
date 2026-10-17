'use client';

import React from 'react';
import Link from 'next/link';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { deadlineState, formatDateTime } from '@/features/review-shared/format';
import { BTN, BTN_PRIMARY, BTN_SM } from '@/lib/button-styles';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
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
  /** 本期政策是否允許 reviewer 送出後再改；決定表格下方的說明文字。 */
  canEditAfterSubmit?: boolean;
}

/** 「我的驗收任務 → 待驗收教案」（v13 `renderReviewTasks()` 驗收者區塊）。待處理的排前面。 */
export const TaskList: React.FC<TaskListProps> = ({ jobs, reviewDueAt, canEditAfterSubmit }) => {
  const due = deadlineState(reviewDueAt);
  const sorted = [...jobs].sort((a, b) => Number(!isPending(a)) - Number(!isPending(b)));

  if (jobs.length === 0) {
    return (
      <div className="rounded-[10px] border border-black-200 bg-white px-6 py-10 text-center font-['Noto_Sans_TC']">
        <p className="text-[15px] text-black-900">本輪沒有分配給你的教案</p>
        <p className="mt-2 text-[13px] text-black-500">如果你覺得應該要有，請聯絡教案組。</p>
      </div>
    );
  }

  return (
    <>
      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-[760px]`}>
          <thead>
            <tr>
              <th className={TH}>教案</th>
              <th className={TH}>家別</th>
              <th className={TH}>檔案完整性</th>
              <th className={TH}>截止時間</th>
              <th className={TH}>任務狀態</th>
              <th className={TH} aria-label="動作" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((job) => {
              const pending = isPending(job);
              const complete = job.sheet_present && job.slide_present;
              return (
                <tr key={job.id} className={TR}>
                  <td className={TD}>
                    <p className="font-bold">{job.tp_name}</p>
                    <p className="mt-[2px] text-[12px] text-black-500">
                      {job.grade}・{job.duration} 分鐘{job.my_slot ? `・Slot ${job.my_slot}` : ''}
                    </p>
                  </td>
                  <td className={TD}>{job.family}</td>
                  <td className={TD}>
                    <StatusChip status={complete ? '完整' : '請確認附件'} tone={complete ? 'done' : 'active'} />
                  </td>
                  <td className={`${TD} ${due.overdue && pending ? 'text-status-alert' : ''}`}>
                    {reviewDueAt ? (
                      <>
                        <p className="text-[13px]">{formatDateTime(reviewDueAt)}</p>
                        {pending && due.label && <p className="text-[12px]">{due.label}</p>}
                      </>
                    ) : (
                      <span className="text-[13px] text-black-500">未設定</span>
                    )}
                  </td>
                  <td className={TD}>
                    <StatusChip status={taskStatusLabel(job)} tone={job.my_review_state ? undefined : 'info'} />
                  </td>
                  <td className={`${TD} text-right`}>
                    <Link
                      href={`/review/tasks/${job.id}`}
                      className={`${pending ? BTN_PRIMARY : BTN} ${BTN_SM}`}
                    >
                      {pending ? '開始驗收' : '查看驗收'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        {canEditAfterSubmit
          ? '本期開放送出後修改，任務鎖定前都還可以回去改。'
          : '本期不開放送出後修改，如需更正請找教案組。'}
      </p>
    </>
  );
};
