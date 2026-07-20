// components/ui/Modal.tsx
'use client';
import React from 'react';

type Props = {
  open: boolean;
  description?: string;
  onClose: () => void;          // 點遮罩或右上角X
  confirmText?: string;
  onConfirm?: () => void;       // 點主按鈕
};

export function Modal({
  open,
  description,
  onClose,
  confirmText = '我知道了',
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1000">
      {/* 背景反黑：#0D0D0DB2 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#0D0D0DB2' }}
        onClick={onClose}
        aria-hidden
      />
      {/* 卡片 420x172、圓角8、白底、padding 40/60/32/60、gap 28 */}
      <div
        className="
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[420px] h-[172px] rounded-[8px] bg-white shadow-xl
        "
        role="dialog"
        aria-modal="true"
      >
        <div className="relative h-full flex flex-col items-center justify-center pt-[40px] pr-[60px] pb-[32px] pl-[60px] gap-[28px]">
          {/* 右上角關閉 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            title="關閉"
            className="absolute right-3 top-3 text-black/60 hover:text-black/90 hover:cursor-pointer"
          >
            ✕
          </button>

          {/* 內文：Noto Sans TC / 16px / 150% / 置中 / Black/900 */}
          <p
            className="text-[16px] leading-[24px] text-center text-black-900 whitespace-pre-line"
            style={{ fontFamily: '"Noto Sans TC", sans-serif', fontWeight: 400 }}
          >
            {description}
          </p>

          {/* 按鈕：160x48、圓角8、padding 12/48、Primary/900 */}
          <button
            type="button"
            onClick={onConfirm ?? onClose}
            className="
              w-[160px] h-[48px] rounded-[8px] px-[48px] py-[12px]
              bg-primary-900 text-white font-semibold hover:opacity-90 hover:cursor-pointer
              focus:outline-hidden focus:ring-2 focus:ring-primary-900/40
            "
            style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
