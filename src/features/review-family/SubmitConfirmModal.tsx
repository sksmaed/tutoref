'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { FamilyPlan, MissingItem } from '@/services/review';

interface SubmitConfirmModalProps {
  open: boolean;
  included: FamilyPlan[];
  excluded: FamilyPlan[];
  missing: MissingItem[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 送出確認。D3：本期不做漏送補件，送出就是最終狀態，
 * 所以這個 modal 比一般 ConfirmModal 重——被排除的教案要列完整清單，
 * 只給數字等於要家長自己心算（§6.1）。
 */
export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  open,
  included,
  excluded,
  missing,
  submitting,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const missingCount = missing.reduce((total, item) => total + (item.missing_count || 0), 0);
  const missingPeople = missing.length;

  return (
    <div className="fixed inset-0 z-1000">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#0D0D0DB2' }}
        onClick={submitting ? undefined : onClose}
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 flex max-h-[86vh] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[8px] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative px-8 pt-8 pb-4">
          <button
            type="button"
            onClick={submitting ? undefined : onClose}
            aria-label="關閉"
            className="absolute right-3 top-3 text-black/60 hover:text-black/90 hover:cursor-pointer"
          >
            ✕
          </button>
          <h3 className="text-center font-['Noto_Sans_TC'] text-[20px] font-medium text-black-900">
            確認本輪送出內容
          </h3>

          <div className="mt-5 flex items-stretch justify-center gap-4">
            <div className="flex-1 rounded-lg bg-status-active-bg px-4 py-3 text-center">
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">本輪送出</p>
              <p className="font-['Noto_Sans_TC'] text-[32px] font-bold leading-tight text-status-active">
                {included.length}
              </p>
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">份</p>
            </div>
            <div className="flex-1 rounded-lg bg-black-100 px-4 py-3 text-center">
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">不納入本輪</p>
              <p className="font-['Noto_Sans_TC'] text-[32px] font-bold leading-tight text-status-idle">
                {excluded.length}
              </p>
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">份</p>
            </div>
            <div className="flex-1 rounded-lg bg-black-100 px-4 py-3 text-center">
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">缺交註記</p>
              <p className="font-['Noto_Sans_TC'] text-[32px] font-bold leading-tight text-status-idle">
                {missingCount}
              </p>
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
                份 / {missingPeople} 人
              </p>
            </div>
          </div>
        </div>

        {excluded.length > 0 && (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-black-100 px-8 py-4 custom-scroll">
            <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
              以下 {excluded.length} 份不會進入本輪驗收
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {excluded.map((plan) => (
                <li
                  key={plan.plan_id}
                  className="flex items-baseline justify-between gap-3 font-['Noto_Sans_TC'] text-[14px] text-black-700"
                >
                  <span className="truncate">{plan.tp_name}</span>
                  <span className="shrink-0 text-[13px] text-black-500">
                    {plan.writer_names.join('、') || '未填撰寫者'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-black-100 px-8 pt-4 pb-6">
          <p className="font-['Noto_Sans_TC'] text-[14px] leading-[150%] text-status-alert">
            送出後本輪清單與附件不可再修改，且無法補送。
          </p>
          <div className="mt-4 flex justify-center gap-[10px]">
            <Button
              onClick={submitting ? undefined : onClose}
              disabled={submitting}
              className="w-[130px] whitespace-nowrap rounded-lg border border-primary-900 bg-white py-3 text-base text-primary-900"
            >
              再檢查一次
            </Button>
            <Button
              onClick={submitting ? undefined : onConfirm}
              disabled={submitting}
              className="w-[220px] whitespace-nowrap rounded-lg bg-primary-900 py-3 text-base font-bold text-white"
            >
              {submitting ? '送出中…' : '確認並送出本輪驗收'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
