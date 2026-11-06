import React from 'react';

interface BulkActionBarProps {
  /** false 時整條不出現（例如沒有選取任何項目）。 */
  visible?: boolean;
  /** 左側摘要，例如「已選 12 份｜缺交 3 份」。 */
  summary: React.ReactNode;
  /** 右側動作按鈕。 */
  children: React.ReactNode;
  className?: string;
  /** sticky：黏在畫面底部（預設）；inline：放在表格上方的淺色條（v13 `.bulkbar`）。 */
  variant?: 'sticky' | 'inline';
}

/**
 * sticky 在畫面底部的批量動作列。
 * 後台一次處理 60–100 列，按鈕捲出畫面是 prototype 回饋裡明確提到的痛點（§8.3）。
 */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  visible = true,
  summary,
  children,
  className = '',
  variant = 'sticky',
}) => {
  if (!visible) return null;

  if (variant === 'inline') {
    return (
      <div
        className={`mb-3 flex flex-wrap items-center justify-between gap-[10px] rounded-xl border border-primary-300 bg-primary-100 px-3 py-[10px] ${className}`}
      >
        <div className="font-['Noto_Sans_TC'] text-[14px] text-black-700">{summary}</div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`sticky bottom-0 z-40 -mx-4 mt-6 border-t border-black-200 bg-white px-4 py-3 shadow-[0_-2px_10px_0px_rgba(0,0,0,0.08)] sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-b-lg ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[15px] font-['Noto_Sans_TC'] text-black-900">{summary}</div>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </div>
  );
};
