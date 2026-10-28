import React from 'react';

interface PageHeadProps {
  title: string;
  subtitle?: React.ReactNode;
  /** 右側動作按鈕區。 */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * 頁面標題區：標題 + 副標 + 右側動作（v13 `.page-head`）。
 * 右側留白避開固定在右上角的使用者選單。
 */
export function PageHead({ title, subtitle, actions, className = '' }: PageHeadProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-3 md:min-h-[42px] md:flex-row md:items-center md:justify-between md:pr-16 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="font-['Noto_Sans_TC'] text-[21px] font-bold leading-[150%] text-black-900">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 font-['Noto_Sans_TC'] text-[13px] leading-[160%] text-black-500">
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
