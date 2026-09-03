'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { FeedbackItemList } from './FeedbackItemList';
import type { AuthorJobRow, FeedbackItemRow, FeedbackStatus } from '@/services/review';

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

interface AuthorPlanListProps {
  jobs: AuthorJobRow[];
  feedback: Record<string, FeedbackItemRow[]>;
  /** 就地更新後仍要正確的進度, 所以由 hook 依已載入的回饋推算。 */
  jobProgress: (job: AuthorJobRow) => { total: number; todo: number; done: number };
  working: boolean;
  onRespond: (itemId: string, status: FeedbackStatus, body: string) => Promise<void>;
  onUploadRevision: (job: AuthorJobRow) => void;
}

export const AuthorPlanList: React.FC<AuthorPlanListProps> = ({
  jobs,
  feedback,
  jobProgress,
  working,
  onRespond,
  onUploadRevision,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="mt-6 rounded-lg bg-white px-6 py-12 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <p className="font-['Noto_Sans_TC'] text-[16px] text-black-900">本輪沒有你的教案</p>
        <p className="mt-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
          家長送出本輪驗收之後，你負責撰寫的教案就會出現在這裡。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {jobs.map((job) => {
        const items = feedback[job.id] ?? [];
        const open = expanded === job.id;
        const progress = jobProgress(job);
        return (
          <div
            key={job.id}
            className="rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">{job.tp_name}</p>
                <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
                  {job.family}
                  {job.average ? `・平均 ${job.average}` : ''}
                  {progress.total > 0 ? `・回饋 ${progress.done} / ${progress.total} 則已處理` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusChip status={authorStatusLabel(job)} />
                {/* 上傳入口放在初驗列上，不是只在總驗 tab（§6.2） */}
                <Button
                  onClick={() => onUploadRevision(job)}
                  className="border border-primary-900 bg-white px-3 py-1 text-[14px] text-primary-900"
                >
                  上傳修改版
                </Button>
                {progress.total > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : job.id)}
                    className="font-['Noto_Sans_TC'] text-[14px] text-primary-900 hover:opacity-80 hover:cursor-pointer"
                  >
                    {open ? '收合回饋' : '查看回饋'}
                  </button>
                )}
              </div>
            </div>

            {open && (
              <div className="mt-3 border-t border-black-100 pt-2">
                <FeedbackItemList items={items} working={working} onRespond={onRespond} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
