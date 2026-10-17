import React from 'react';

/** 白底卡片（v13 `.card`）。`padded` 為 false 時由內容自己決定 padding。 */
export function Card({
  children,
  padded = true,
  className = '',
}: {
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[10px] border border-black-200 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.045)] ${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/** 卡片內的區塊標題列：標題 + 說明 + 右側附加內容。 */
export function CardHeader({
  title,
  description,
  extra,
}: {
  title: string;
  description?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">{title}</p>
        {description && (
          <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] leading-[155%] text-black-500">
            {description}
          </p>
        )}
      </div>
      {extra}
    </div>
  );
}

/** 數字指標卡（v13 `.metric`）。 */
export function MetricCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card padded={false} className="px-[18px] pb-4 pt-[18px]">
      <p className="font-['Noto_Sans_TC'] text-[12px] text-black-500">{label}</p>
      <div className="my-1 font-['Noto_Sans_TC'] text-[28px] font-extrabold leading-tight text-black-900">
        {value}
      </div>
      {hint && <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-status-done">{hint}</p>}
      {children}
    </Card>
  );
}
