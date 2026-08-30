import React from 'react';

type BannerTone = 'locked' | 'alert' | 'active';

const TONE_CLASS: Record<BannerTone, string> = {
  locked: 'bg-status-locked-bg text-status-locked border-black-200',
  alert: 'bg-status-alert-bg text-status-alert border-status-alert',
  active: 'bg-status-active-bg text-status-active border-primary-300',
};

interface LockBannerProps {
  title: string;
  description?: string;
  tone?: BannerTone;
  className?: string;
}

/** 「本輪已送出／已鎖定」提示條，放在頁面最上方。 */
export const LockBanner: React.FC<LockBannerProps> = ({
  title,
  description,
  tone = 'locked',
  className = '',
}) => (
  <div
    className={`w-full rounded-lg border px-4 py-3 font-['Noto_Sans_TC'] ${TONE_CLASS[tone]} ${className}`}
    role="status"
  >
    <p className="text-[15px] font-bold leading-[150%]">{title}</p>
    {description && <p className="mt-1 text-[14px] leading-[150%]">{description}</p>}
  </div>
);
