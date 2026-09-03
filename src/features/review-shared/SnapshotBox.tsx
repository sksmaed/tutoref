import React from 'react';
import { formatDateTime } from './format';

interface SnapshotBoxProps {
  /** 送出時間；null 代表尚未送出。 */
  submittedAt?: string | null;
  sheetPresent?: boolean;
  slidePresent?: boolean;
  /** 表格欄位裡用的窄版。 */
  compact?: boolean;
  className?: string;
}

const FileMark: React.FC<{ label: string; present?: boolean }> = ({ label, present }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap ${present ? 'text-status-done' : 'text-status-idle'}`}
  >
    <span aria-hidden>{present ? '✓' : '—'}</span>
    {label}
  </span>
);

/**
 * 送出快照：送出時間 + 教案紙 / 投影片兩個檔案狀態。
 * 快照是送出當下凍結的內容，之後改教案不會變動這裡（§6.1）。
 */
export const SnapshotBox: React.FC<SnapshotBoxProps> = ({
  submittedAt,
  sheetPresent,
  slidePresent,
  compact = false,
  className = '',
}) => {
  if (!submittedAt) {
    return (
      <span className={`text-[13px] text-black-500 font-['Noto_Sans_TC'] ${className}`}>尚未送出</span>
    );
  }

  const files = (
    <span className="flex items-center gap-3 text-[13px]">
      <FileMark label="教案紙" present={sheetPresent} />
      <FileMark label="投影片" present={slidePresent} />
    </span>
  );

  if (compact) {
    return (
      <span className={`flex flex-col items-center gap-[2px] font-['Noto_Sans_TC'] ${className}`}>
        <span className="text-[13px] text-black-700">{formatDateTime(submittedAt)}</span>
        {files}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border border-black-200 bg-white px-4 py-3 font-['Noto_Sans_TC'] ${className}`}
    >
      <p className="text-[14px] text-black-700">
        送出時間：<span className="text-black-900">{formatDateTime(submittedAt)}</span>
      </p>
      <div className="mt-2">{files}</div>
    </div>
  );
};
