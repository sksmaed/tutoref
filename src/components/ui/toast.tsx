'use client';
import { useEffect } from 'react';
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
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-[1000]">
      <div
        className="
          w-full
          rounded-[8px]
          bg-[#2A2A2A] opacity-100
          shadow-lg
        "
        role="status"
        aria-live="polite"
      >
        <div className="w-full flex items-start justify-between py-5 sm:py-6 pl-5 sm:pl-7 pr-5 sm:pr-6">
          {/* 左區：使用 flex-1 讓文字區域佔據可用空間，不再固定寬度 */}
          <div className="flex items-start flex-1 gap-[15px] text-white pr-4">
            {/* icon：24×28（不再加 padding-top，避免把內容往下推） */}
            <div className="pt-1 shrink-0">
              <img
                src="/icons/check-circle.svg"
                alt=""
                width={24}
                height={24}
                className="w-[24px] h-[24px]"
              />
            </div>

            {/* 文字：使用 flex-1 讓文字佔據剩餘空間 */}
            <div className={`flex flex-col ${message ? 'gap-[4px]' : ''} overflow-hidden flex-1`}>
              {/* 「登入成功」— Noto Sans TC / 500 / 20px / 150% / #FFFFFF */}
              <div
                className="
                  font-medium text-[17px] sm:text-[20px] leading-[150%]
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
