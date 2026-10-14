'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
import type { ResultRow } from '@/services/review';

export type ResultAction = 'passed' | 'remedial' | 'publish';

const ACTION_TITLE: Record<ResultAction, string> = {
  passed: '確認並鎖定結果：通過',
  remedial: '確認並鎖定結果：補驗',
  publish: '發布驗收結果',
};

interface ResultConfirmModalProps {
  action: ResultAction | null;
  rows: ResultRow[];
  working: boolean;
  onClose: () => void;
  onConfirm: (options: { reason: string; force: boolean }) => void;
}

/**
 * 批量套用結果前一律跳確認，且列出教案名稱清單（§6.6）——
 * 只給數字等於要組長自己回想剛剛勾了哪幾份。
 */
export const ResultConfirmModal: React.FC<ResultConfirmModalProps> = ({
  action,
  rows,
  working,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [force, setForce] = useState(false);

  useEffect(() => {
    if (!action) return;
    setReason('');
    setForce(false);
  }, [action]);

  const isPublish = action === 'publish';

  return (
    <Dialog
      open={!!action}
      onClose={onClose}
      busy={working}
      size="sm"
      title={action ? ACTION_TITLE[action] : ''}
      subtitle={`共 ${rows.length} 份教案`}
      footer={
        <>
          <button type="button" className={BTN} onClick={onClose} disabled={working}>
            取消
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => onConfirm({ reason, force })}
            disabled={working || rows.length === 0 || (force && !reason.trim())}
          >
            {working ? '處理中…' : isPublish ? '確認發布' : '確認並鎖定結果'}
          </button>
        </>
      }
    >
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li
            key={row.job_id}
            className="flex items-baseline justify-between gap-3 font-['Noto_Sans_TC'] text-[14px] text-black-700"
          >
            <span className="truncate">{row.tp_name}</span>
            <span className="shrink-0 text-[12px] text-black-500">
              {row.family}・平均 {row.average ?? '—'}
            </span>
          </li>
        ))}
      </ul>

      {isPublish ? (
        <LockBanner
          className="mt-4"
          tone="alert"
          title="發布後作者就會看到結果與逐則回饋"
          description="結果發布後不可再修改。"
        />
      ) : (
        <div className="mt-4 border-t border-black-200 pt-4">
          <label className="block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700">
            判定理由（選填，會寫進稽核紀錄）
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              className="mt-[6px] w-full rounded-[10px] border border-black-200 px-3 py-2 text-[14px] font-normal"
            />
          </label>
          <label className="mt-3 flex cursor-pointer items-start gap-2 font-['Noto_Sans_TC'] text-[13px] text-black-700">
            <input
              type="checkbox"
              checked={force}
              onChange={(event) => setForce(event.target.checked)}
              className="mt-[3px] h-4 w-4 accent-primary-900"
            />
            <span>已指派驗收者尚未全數完成時仍強制套用（需填理由；系統會記錄是誰強制的）</span>
          </label>
        </div>
      )}
    </Dialog>
  );
};
