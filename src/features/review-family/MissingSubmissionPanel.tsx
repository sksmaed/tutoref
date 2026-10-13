'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { BTN, BTN_SM } from '@/lib/button-styles';
import type { MissingItem } from '@/services/review';

interface MissingSubmissionPanelProps {
  items: MissingItem[];
  onChange: (items: MissingItem[]) => void;
  disabled?: boolean;
  /** 已送出時只顯示總份數。 */
  readonlyTotal?: number | null;
}

const INPUT =
  "rounded-[10px] border border-black-200 bg-white px-[10px] py-[7px] font-['Noto_Sans_TC'] text-[14px] text-black-900";

/**
 * 缺交註記（v13 `familyMissingPanel()`）：以份數為主，姓名／原因可空（§6.1）。
 *
 * D1：缺交的教案本輪不進行驗收，這裡只是紀錄，送出時與待驗收教案一起交給教案組。
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

  return (
    <Card className="mt-[18px]">
      <CardHeader
        title="缺交註記"
        description="記錄本輪應交但尚未完成繳交的教案；送出後會與本輪待驗收教案一起提供給教案組。缺交的教案本輪不進行驗收，系統不會自動追。"
        extra={disabled ? <StatusChip status="已送出" /> : undefined}
      />

      {disabled ? (
        <p className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
          本輪已送出，共註記 <span className="font-bold">{readonlyTotal ?? 0}</span> 份缺交。
        </p>
      ) : items.length === 0 ? (
        <p className="py-4 text-center font-['Noto_Sans_TC'] text-[14px] text-black-500">目前沒有缺交註記</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={item.reason ?? ''}
                placeholder="缺交者姓名或原因（可留空）"
                onChange={(event) => update(index, { reason: event.target.value })}
                className={`${INPUT} min-w-[200px] flex-1`}
              />
              <label className="inline-flex items-center gap-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
                <input
                  type="number"
                  min={1}
                  value={item.missing_count}
                  onChange={(event) =>
                    update(index, { missing_count: Math.max(1, Number(event.target.value) || 1) })
                  }
                  className={`${INPUT} w-[72px]`}
                />
                份
              </label>
              <StatusChip status="待送出" tone="active" />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className={`${BTN} ${BTN_SM} text-status-alert`}
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...items, { missing_count: 1, reason: '' }])}
          className={`${BTN} mt-3`}
        >
          ＋ 註記缺交
        </button>
      )}
    </Card>
  );
};
