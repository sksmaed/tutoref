import React from 'react';

/**
 * 驗收模組所有狀態徽章的唯一實作（docs/REVIEW_MODULE_PLAN.md §4.2）。
 * 各頁面不要自己寫 bg-xxx-100 text-xxx-700，狀態 → 樣式的對應集中在這裡。
 */

export type StatusTone = 'idle' | 'active' | 'done' | 'alert' | 'locked';

// Tailwind 需要看得到完整 class 字串，不能動態拼接。
const TONE_CLASS: Record<StatusTone, string> = {
  idle: 'bg-status-idle-bg text-status-idle',
  active: 'bg-status-active-bg text-status-active',
  done: 'bg-status-done-bg text-status-done',
  alert: 'bg-status-alert-bg text-status-alert',
  locked: 'bg-status-locked-bg text-status-locked',
};

/** 業務狀態文案 → chip 樣式（§4.2 對應表）。 */
const STATUS_TONE: Record<string, StatusTone> = {
  未繳交: 'idle',
  尚未送出: 'idle',
  待分配: 'idle',
  未納入本輪: 'idle',
  待驗收: 'active',
  驗收中: 'active',
  待處理: 'active',
  待修改: 'active',
  已送出: 'done',
  已完成: 'done',
  已通過: 'done',
  已凍結: 'done',
  補驗: 'alert',
  未通過: 'alert',
  缺附件: 'alert',
  已鎖定: 'locked',
  唯讀: 'locked',
  已發布不可改: 'locked',
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? 'idle';
}

interface StatusChipProps {
  /** 業務狀態文案，例如「已送出」。同時是 chip 上顯示的字。 */
  status: string;
  /** 對應表沒有涵蓋時可明確指定樣式。 */
  tone?: StatusTone;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, tone, className = '' }) => (
  <span
    className={`inline-flex items-center rounded-lg px-2 py-[2px] text-[13px] leading-[150%] font-medium font-['Noto_Sans_TC'] whitespace-nowrap ${TONE_CLASS[tone ?? statusTone(status)]} ${className}`}
  >
    {status}
  </span>
);
