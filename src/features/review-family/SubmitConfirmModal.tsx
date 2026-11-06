'use client';

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { MetricCard } from '@/components/ui/Card';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
import type { FamilyPlan, MissingItem } from '@/services/review';

interface SubmitConfirmModalProps {
  open: boolean;
  /** 「初驗」或「總驗」。 */
  roundLabel: string;
  included: FamilyPlan[];
  excluded: FamilyPlan[];
  missing: MissingItem[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 送出確認（v13 `submitFamilyReview()`）。D3：本期不做漏送補件，送出就是最終狀態，
 * 所以被排除的教案要列完整清單，只給數字等於要家長自己心算（§6.1）。
 */
export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  open,
  roundLabel,
  included,
  excluded,
  missing,
  submitting,
  onClose,
  onConfirm,
}) => {
  const missingCount = missing.reduce((total, item) => total + (item.missing_count || 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={submitting}
      size="sm"
      title={`確認送出${roundLabel}`}
      subtitle={`送出後${roundLabel}內容將永久凍結，只能檢視`}
      footer={
        <>
          <button type="button" className={BTN} onClick={onClose} disabled={submitting}>
            返回檢查
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={onConfirm} disabled={submitting}>
            {submitting ? '送出中…' : '確認送出'}
          </button>
        </>
      }
    >
      <LockBanner
        tone="active"
        title="送出後本輪不能再修改，也無法補送"
        description="請再次確認待驗收教案、附件與缺交註記。"
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCard label="待驗收教案" value={included.length}>
          <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] leading-[155%] text-black-500">
            {included.map((plan) => plan.tp_name).join('、') || '—'}
          </p>
        </MetricCard>
        <MetricCard label="缺交註記" value={missingCount}>
          <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-black-500">
            共 {missing.length} 筆紀錄
          </p>
        </MetricCard>
      </div>

      {excluded.length > 0 && (
        <div className="mt-4">
          <p className="font-['Noto_Sans_TC'] text-[14px] font-bold text-black-900">
            以下 {excluded.length} 份不會進入本輪驗收
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {excluded.map((plan) => (
              <li
                key={plan.plan_id}
                className="flex items-baseline justify-between gap-3 font-['Noto_Sans_TC'] text-[14px] text-black-700"
              >
                <span className="truncate">{plan.tp_name}</span>
                <span className="shrink-0 text-[12px] text-black-500">
                  {plan.writer_names.join('、') || '未填撰寫者'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
};
