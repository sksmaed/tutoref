'use client';

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Card, CardHeader, MetricCard } from '@/components/ui/Card';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
import type { Round } from '@/features/review-shared/types';
import type { AuthorJobRow, FeedbackItemRow, FeedbackStatus } from '@/services/review';
import { FeedbackItemList } from './FeedbackItemList';
import { authorStatusLabel } from './AuthorPlanTable';

interface AuthorRoundPlanModalProps {
  job: AuthorJobRow | null;
  round: Round;
  termLabel?: string;
  feedback: FeedbackItemRow[];
  progress: { total: number; done: number };
  working: boolean;
  onClose: () => void;
  onRespond: (itemId: string, status: FeedbackStatus, body: string) => Promise<void>;
  onUploadRevision: (job: AuthorJobRow) => void;
}

/** 撰寫者看自己的一份教案（v13 `openRoundLesson()`）：結果、修改版上傳、回饋處理。 */
export const AuthorRoundPlanModal: React.FC<AuthorRoundPlanModalProps> = ({
  job,
  round,
  termLabel,
  feedback,
  progress,
  working,
  onClose,
  onRespond,
  onUploadRevision,
}) => {
  if (!job) return null;
  const roundLabel = round === 'final' ? '總驗' : '初驗';

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      eyebrow={[termLabel, roundLabel, job.family].filter(Boolean).join('・')}
      title={job.tp_name}
      footer={
        <button type="button" className={BTN} onClick={onClose}>
          關閉
        </button>
      }
    >
      {/* 上傳入口放在初驗與總驗兩邊（§6.2）：作者常在看初驗回饋時就想交修改版 */}
      <Card className="mb-4">
        <CardHeader
          title="總驗修改版"
          description="在自己的電腦完成修改後，於這裡上傳最新教案紙。初驗當下的版本已凍結成快照，不會被覆蓋；家長送出總驗時才鎖定。"
          extra={<StatusChip status={job.sheet_present ? '教案紙已上傳' : '缺教案紙'} tone={job.sheet_present ? 'done' : 'active'} />}
        />
        <button type="button" className={BTN_PRIMARY} onClick={() => onUploadRevision(job)}>
          上傳總驗修改版
        </button>
      </Card>

      <div className="mb-[18px] grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard label="驗收結果" value={<span className="text-[18px]">{authorStatusLabel(job)}</span>} />
        <MetricCard
          label="回饋處理"
          value={
            <span className="text-[18px]">
              {progress.total ? `${progress.done} / ${progress.total} 則已處理` : '尚無回饋'}
            </span>
          }
        />
      </div>

      <p className="mb-3 font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
        {round === 'final' ? '初驗回饋處理回顧' : '初驗回饋'}
      </p>
      {job.result_published || feedback.length > 0 ? (
        <FeedbackItemList items={feedback} working={working} onRespond={onRespond} />
      ) : (
        <p className="font-['Noto_Sans_TC'] text-[13px] text-black-500">初驗結果公告後才會顯示回饋。</p>
      )}
    </Dialog>
  );
};
