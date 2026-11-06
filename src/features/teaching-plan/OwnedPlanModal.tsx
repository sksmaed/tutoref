'use client';

import Link from 'next/link';
import { Dialog, KeyValueList } from '@/components/ui/Dialog';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BTN, BTN_DANGER, BTN_PRIMARY } from '@/lib/button-styles';
import { PlanStatusBadges } from './PlanStatusBadges';
import { formatShortDateTime, type Row } from './AllPlansTable';

const REVIEW_AUTHOR_HREF = '/review/tasks';

interface OwnedPlanModalProps {
  row: Row | null;
  onClose: () => void;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}

/** 已上傳教案的小視窗（v13 `openOwnedLesson()`）：基本資訊 + 編輯 / 刪除。 */
export function OwnedPlanModal({ row, onClose, onEdit, onDelete }: OwnedPlanModalProps) {
  if (!row) return null;
  const fileText = (has?: boolean) => (has === undefined ? '—' : has ? '已上傳' : '尚未上傳');

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      eyebrow={[row.issue, row.family].filter(Boolean).join('・')}
      title={row.title}
      footer={
        <>
          <button
            type="button"
            className={`${BTN_DANGER} mr-auto`}
            onClick={() => onDelete(row)}
            disabled={row.inReview}
          >
            刪除
          </button>
          <button type="button" className={BTN} onClick={onClose}>
            關閉
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => onEdit(row)}
            disabled={row.inReview}
          >
            編輯教案
          </button>
        </>
      }
    >
      {row.inReview && (
        <div className="mb-4">
          <LockBanner
            title="本期教案已進入驗收流程"
            description="驗收期間的回饋處理與總驗修改檔上傳，請到「我的驗收任務」完成。"
          />
          <Link
            href={REVIEW_AUTHOR_HREF}
            className="mt-2 inline-block font-['Noto_Sans_TC'] text-[14px] font-bold text-primary-900 hover:opacity-80"
          >
            前往我的驗收任務 →
          </Link>
        </div>
      )}
      <KeyValueList
        items={[
          { label: '類別', value: row.category || '—' },
          { label: '教案紙', value: fileText(row.hasSheet) },
          { label: '投影片', value: fileText(row.hasSlides) },
          {
            label: '狀態',
            value: (
              <PlanStatusBadges
                editingStatus={row.editingStatus}
                visibilityStatus={row.visibilityStatus}
                compact
              />
            ),
          },
          { label: '最後更新', value: formatShortDateTime(row.updatedAt) },
        ]}
      />
    </Dialog>
  );
}
