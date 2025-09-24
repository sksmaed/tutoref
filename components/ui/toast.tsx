'use client';
import { useEffect } from 'react';
import Image from 'next/image';
// 若全站已載入 Noto Sans TC 可忽略；否則建議用 next/font 在 layout 設定。

type Props = {
  open: boolean;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  timeout?: number; // ms
  onClose: () => void;
};

export function Toast({
  open,
  type = 'success',
  title,
  message,
  timeout = 5000,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, timeout);
    return () => clearTimeout(t);
  }, [open, timeout, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-1000">
      <div
        className="
          w-[480px] h-[110px]
          rounded-[8px]
          bg-[#2A2A2A] opacity-100
          shadow-lg
        "
        role="status"
        aria-live="polite"
      >
        {/* 上下等高：py-6 (= 24px / 24px)，左右仍為 pl-7(28px) / pr-6(24px) */}
        {/* 用 items-center + justify-between，讓左區與關閉鈕撐開且垂直置中 */}
        <div className="w-full h-full flex items-start justify-between py-6 pl-7 pr-6">
          {/* 左區：固定寬 260（照稿），不再固定高度，gap 15 */}
          <div className="flex items-start w-[260px] gap-[15px] text-white">
            {/* icon：24×28（不再加 padding-top，避免把內容往下推） */}
            <div className="pt-1 shrink-0">
              <Image
                src="/icons/check-circle.png"
                alt=""
                width={24}
                height={24}
                className="w-[24px] h-[24px]"
                priority
              />
            </div>

            {/* 文字：拿掉 h-[58px]，避免「留一格」；有第二行才給 gap */}
            <div className={`flex flex-col ${message ? 'gap-[4px]' : ''} overflow-hidden`}>
              {/* 「登入成功」— Noto Sans TC / 500 / 20px / 150% / #FFFFFF */}
              <div
                className="
                  font-medium text-[20px] leading-[30px]  /* 20px × 150% = 30px */
                  text-white
                  truncate
                "
                style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
              >
                {title}
              </div>

              {/* 「可以搜尋或管理教案囉～」— Noto Sans TC / 400 / 16px / 150% / #B8B8B8 */}
              {message && (
                <div
                  className="
                    font-normal text-[16px] leading-[24px]
                    text-[#B8B8B8]
                    line-clamp-2
                  "
                  style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
                >
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* 右側關閉鈕固定在右邊，不縮小 */}
          <button
            className="text-white/80 hover:text-white transition-opacity shrink-0 hover:cursor-pointer"
            onClick={onClose}
            aria-label="關閉提示"
            title="關閉"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
