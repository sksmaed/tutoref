'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { BTN, BTN_SM } from '@/lib/button-styles';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
import type { AuthorJobRow } from '@/services/review';

const DECISION_LABEL: Record<string, string> = { passed: '通過', remedial: '補驗' };

const JOB_STATE_LABEL: Record<string, string> = {
  draft: '待分配',
  assignment_saved: '待分配',
  assignment_published: '待驗收',
  in_review: '驗收中',
  review_closed: '待處理',
  result_locked: '已鎖定',
  result_published: '已完成',
};

/** 結果沒發布前一律顯示流程狀態，不透露任何判定（I8）。 */
export function authorStatusLabel(job: AuthorJobRow): string {
  if (job.result_published && job.decision) return DECISION_LABEL[job.decision] ?? job.decision;
  return JOB_STATE_LABEL[job.job_state] ?? job.job_state;
}

export function FeedbackProgressChip({ progress }: { progress: { total: number; done: number } }) {
  if (progress.total === 0) return <span className="text-black-500">—</span>;
  const pending = progress.total - progress.done;
  return (
    <StatusChip
      status={`${progress.done}/${progress.total} 已處理`}
      tone={pending > 0 ? 'active' : 'done'}
    />
  );
}

interface AuthorPlanTableProps {
  jobs: AuthorJobRow[];
  jobProgress: (job: AuthorJobRow) => { total: number; todo: number; done: number };
  onOpen: (job: AuthorJobRow) => void;
}

/** 「我的驗收任務 → 我的教案」（v13 `renderReviewTasks()` 撰寫者區塊）。 */
export const AuthorPlanTable: React.FC<AuthorPlanTableProps> = ({ jobs, jobProgress, onOpen }) => {
  if (jobs.length === 0) {
    return (
      <div className="rounded-[10px] border border-black-200 bg-white px-6 py-10 text-center font-['Noto_Sans_TC']">
        <p className="text-[15px] text-black-900">本輪沒有你的教案</p>
        <p className="mt-2 text-[13px] text-black-500">
          家長送出本輪驗收之後，你負責撰寫的教案就會出現在這裡。
        </p>
      </div>
    );
  }

  return (
    <div className={TABLE_WRAP}>
      <table className={`${TABLE} min-w-[760px]`}>
        <thead>
          <tr>
            <th className={TH}>教案</th>
            <th className={TH}>家別</th>
            <th className={TH}>檔案完整性</th>
            <th className={TH}>送出狀態</th>
            <th className={TH}>回饋處理</th>
            <th className={TH}>驗收結果</th>
            <th className={TH} aria-label="動作" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const complete = job.sheet_present && job.slide_present;
            return (
              <tr key={job.id} className={TR}>
                <td className={TD}>
                  <p className="font-bold">{job.tp_name}</p>
                  {job.average && <p className="mt-[2px] text-[12px] text-black-500">平均 {job.average}</p>}
                </td>
                <td className={TD}>{job.family}</td>
                <td className={TD}>
                  <StatusChip status={complete ? '完整' : '缺少附件'} tone={complete ? 'done' : 'active'} />
                </td>
                {/* 有 job 就代表家長已送出本輪 */}
                <td className={TD}>
                  <StatusChip status="已送出" />
                </td>
                <td className={TD}>
                  <FeedbackProgressChip progress={jobProgress(job)} />
                </td>
                <td className={TD}>
                  <StatusChip status={authorStatusLabel(job)} />
                </td>
                <td className={`${TD} text-right`}>
                  <button type="button" className={`${BTN} ${BTN_SM}`} onClick={() => onOpen(job)}>
                    查看
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
