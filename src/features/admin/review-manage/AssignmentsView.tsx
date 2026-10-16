'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { AssignmentByPlan } from '@/features/admin/assignments/AssignmentByPlan';
import { AssignmentByReviewer } from '@/features/admin/assignments/AssignmentByReviewer';
import type { useAssignmentBoard } from '@/features/admin/assignments/useAssignmentBoard';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { Round } from '@/features/review-shared/types';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
import type { FamilySubmissionProgress } from '@/services/review';

type Board = ReturnType<typeof useAssignmentBoard>;
type Notice = { type: 'success' | 'error'; title: string; message?: string };

const VIEW_TABS = [
  { key: 'plan' as const, label: '從教案檢視' },
  { key: 'reviewer' as const, label: '從驗收者檢視' },
];

interface AssignmentsViewProps {
  round: Round;
  board: Board;
  published: boolean;
  progress: FamilySubmissionProgress[];
  finalReusesInitial: boolean;
  isSlotDone: (jobId: string, slot: string) => boolean;
  onNotice: (notice: Notice) => void;
}

/**
 * 分配（v13 `adminAssignments()`）：檢視 / 編輯模式切換，儲存後到訊息公告發布並開放任務。
 * D3：不做批量編輯驗收者，逐份在表格內調整。
 */
export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  round,
  board,
  published,
  progress,
  finalReusesInitial,
  isSlotDone,
  onNotice,
}) => {
  const roundLabel = round === 'final' ? '總驗' : '初驗';
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<'plan' | 'reviewer'>('plan');

  const conflictNames = useMemo(
    () => [...new Set(board.conflicts.map((item) => `${item.reviewerName}（${item.family}）`))],
    [board.conflicts]
  );
  const missingFamilies = progress.filter((family) => family.submitted && family.missing_total > 0);
  const readyToPublish = !published && board.assignmentCount > 0 && board.changes.length === 0 && !editing;

  const handleSave = async () => {
    try {
      await board.save();
      setEditing(false);
      onNotice({
        type: 'success',
        title: `${roundLabel}分配已儲存`,
        // 可見性看的是「這一輪有沒有發布過」，所以已發布的輪次存完就立刻生效
        message: published
          ? '本輪已發布，被指派的人現在就看得到這些變動。'
          : '驗收者還看不到；請到訊息公告發布並開放本輪任務。',
      });
    } catch (err) {
      onNotice({ type: 'error', title: '儲存失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
    }
  };

  return (
    <>
      <LockBanner
        className="mb-[14px]"
        tone={published ? 'active' : editing ? 'active' : 'locked'}
        title={published ? `${roundLabel}分配已發布` : `${roundLabel}分配目前為${editing ? '編輯' : '檢視'}模式`}
        description={
          published
            ? '驗收者已可在「我的驗收任務」查看本輪任務。發布是整輪一次的動作；之後新增或換人只要儲存，對方立刻看得到。'
            : '完成分配後先儲存，再透過訊息公告開放任務。'
        }
      />
      {round === 'final' && finalReusesInitial && (
        <p className="mb-[14px] rounded-xl border border-dashed border-primary-300 bg-primary-100/50 px-[13px] py-[11px] font-['Noto_Sans_TC'] text-[12px] text-black-700">
          總驗驗收者預設沿用初驗；如有人力或分配異動，再進入編輯模式調整。
        </p>
      )}
      {conflictNames.length > 0 && (
        <LockBanner
          className="mb-[14px]"
          tone="alert"
          title="有人被分到自家教案"
          description={`${conflictNames.join('、')}。儲存不會被擋，但對方提交時後端會拒絕。`}
        />
      )}

      <Card className="mb-4">
        <CardHeader
          title="缺交名單"
          description="只有家長完成「送出驗收」後，缺交註記才會同步到教案組。"
          extra={<StatusChip status={`${missingFamilies.length} 家`} tone={missingFamilies.length ? 'active' : 'idle'} />}
        />
        {missingFamilies.length === 0 ? (
          <p className="py-2 text-center font-['Noto_Sans_TC'] text-[13px] text-black-500">目前沒有已送出的缺交紀錄</p>
        ) : (
          <div className={TABLE_WRAP}>
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>家別</th>
                  <th className={TH}>缺交份數</th>
                  <th className={TH}>來源</th>
                </tr>
              </thead>
              <tbody>
                {missingFamilies.map((family) => (
                  <tr key={family.family_id} className={TR}>
                    <td className={`${TD} font-bold`}>{family.family_name}</td>
                    <td className={TD}>{family.missing_total} 份</td>
                    <td className={TD}>
                      <StatusChip status="家長已送出" tone="idle" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-[10px]">
        <SegmentedTabs tabs={VIEW_TABS} active={view} onChange={setView} variant="soft" />
        <span className="font-['Noto_Sans_TC'] text-[12px] text-black-500">
          已分配 {board.assignmentCount} 人次{editing ? `・未儲存 ${board.changes.length} 格` : ''}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {editing ? (
            <>
              <button type="button" className={BTN} onClick={() => setEditing(false)} disabled={board.saving}>
                結束編輯
              </button>
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={handleSave}
                disabled={board.saving || board.changes.length === 0}
              >
                {board.saving ? '儲存中…' : '儲存分配'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={BTN}
              onClick={() => {
                setEditing(true);
                setView('plan');
              }}
              disabled={board.jobs.length === 0}
            >
              編輯分配
            </button>
          )}
          {readyToPublish && (
            <Link href={`/announcement?compose=1&round=${round}`} className={BTN_PRIMARY}>
              前往發布訊息公告
            </Link>
          )}
        </div>
      </div>

      {board.loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : board.error ? (
        <p className="font-['Noto_Sans_TC'] text-[14px] text-status-alert">{board.error}</p>
      ) : view === 'reviewer' ? (
        <AssignmentByReviewer round={round} rows={board.load} />
      ) : (
        <AssignmentByPlan
          jobs={board.jobs}
          slots={board.slots}
          reviewers={board.reviewers}
          editing={editing}
          isSlotDone={isSlotDone}
          onSetSlot={board.setSlot}
          onAddSlot={board.addSlot}
          onRemoveSlot={board.removeSlot}
        />
      )}
    </>
  );
};
