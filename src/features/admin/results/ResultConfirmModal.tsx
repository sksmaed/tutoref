'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
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

  if (!action) return null;
  const isPublish = action === 'publish';

  return (
    <div className="fixed inset-0 z-1000">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#0D0D0DB2' }}
        onClick={working ? undefined : onClose}
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 flex max-h-[86vh] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[8px] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative px-8 pt-8 pb-3">
          <button
            type="button"
            onClick={working ? undefined : onClose}
            aria-label="關閉"
            className="absolute right-3 top-3 text-black/60 hover:text-black/90 hover:cursor-pointer"
          >
            ✕
          </button>
          <h3 className="text-center font-['Noto_Sans_TC'] text-[20px] font-medium text-black-900">
            {ACTION_TITLE[action]}
          </h3>
          <p className="mt-2 text-center font-['Noto_Sans_TC'] text-[15px] text-black-700">
            共 <span className="font-bold text-primary-900">{rows.length}</span> 份教案
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-black-100 px-8 py-3 custom-scroll">
          <ul className="flex flex-col gap-1">
            {rows.map((row) => (
              <li
                key={row.job_id}
                className="flex items-baseline justify-between gap-3 font-['Noto_Sans_TC'] text-[14px] text-black-700"
              >
                <span className="truncate">{row.tp_name}</span>
                <span className="shrink-0 text-[13px] text-black-500">
                  {row.family}・平均 {row.average ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-black-100 px-8 pt-3 pb-6">
          {isPublish ? (
            <p className="font-['Noto_Sans_TC'] text-[14px] leading-[150%] text-status-alert">
              發布後作者就會看到結果與逐則回饋，且結果不可再修改。
            </p>
          ) : (
            <>
              <label className="block font-['Noto_Sans_TC'] text-[13px] text-black-700">
                判定理由（選填，會寫進稽核紀錄）
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-black-200 px-3 py-2 text-[14px]"
                />
              </label>
              <label className="mt-3 flex items-start gap-2 font-['Noto_Sans_TC'] text-[13px] text-black-700">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(event) => setForce(event.target.checked)}
                  className="mt-[3px]"
                />
                <span>
                  兩位 reviewer 尚未齊備時仍強制套用（需填理由；系統會記錄是誰強制的）
                </span>
              </label>
            </>
          )}

          <div className="mt-4 flex justify-center gap-[10px]">
            <Button
              onClick={working ? undefined : onClose}
              disabled={working}
              className="w-[120px] whitespace-nowrap rounded-lg border border-primary-900 bg-white py-3 text-base text-primary-900"
            >
              取消
            </Button>
            <Button
              onClick={working ? undefined : () => onConfirm({ reason, force })}
              disabled={working || rows.length === 0 || (force && !reason.trim())}
              className="w-[200px] whitespace-nowrap rounded-lg bg-primary-900 py-3 text-base font-bold text-white"
            >
              {working ? '處理中…' : isPublish ? '確認發布' : '確認並鎖定結果'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
