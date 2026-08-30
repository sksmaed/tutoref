'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { MissingItem } from '@/services/review';

interface MissingSubmissionPanelProps {
  items: MissingItem[];
  onChange: (items: MissingItem[]) => void;
  disabled?: boolean;
  /** 已送出時只顯示總份數。 */
  readonlyTotal?: number | null;
}

/**
 * 缺交註記：以份數為主，姓名可空（§6.1）。
 *
 * D1：缺交的教案本輪不進行驗收，這裡只是紀錄，不會自動追。
 */
export const MissingSubmissionPanel: React.FC<MissingSubmissionPanelProps> = ({
  items,
  onChange,
  disabled = false,
  readonlyTotal = null,
}) => {
  const update = (index: number, patch: Partial<MissingItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  if (disabled) {
    return (
      <div className="mt-6 rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <p className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">缺交註記</p>
        <p className="mt-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
          本輪已送出，共註記 {readonlyTotal ?? 0} 份缺交。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">缺交註記</p>
        <span className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
          缺交的教案本輪不進行驗收，系統不會自動追。
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 font-['Noto_Sans_TC'] text-[14px] text-black-500">目前沒有缺交紀錄。</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <label className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
                份數
                <input
                  type="number"
                  min={1}
                  value={item.missing_count}
                  onChange={(event) =>
                    update(index, { missing_count: Math.max(1, Number(event.target.value) || 1) })
                  }
                  className="ml-2 w-[72px] rounded-lg border border-black-200 px-2 py-1 text-[14px]"
                />
              </label>
              <input
                type="text"
                value={item.reason ?? ''}
                placeholder="原因（可留空）"
                onChange={(event) => update(index, { reason: event.target.value })}
                className="min-w-[200px] flex-1 rounded-lg border border-black-200 px-3 py-1 text-[14px] font-['Noto_Sans_TC']"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="rounded-lg px-3 py-1 text-[14px] text-black-500 hover:text-status-alert hover:cursor-pointer"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => onChange([...items, { missing_count: 1, reason: '' }])}
        className="mt-3 border border-primary-900 bg-white text-[14px] text-primary-900"
      >
        新增缺交紀錄
      </Button>
    </div>
  );
};
