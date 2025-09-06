// components/ui/ConfirmModal.tsx
'use client';
import React from 'react';
import { Button } from './Button';

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;          // 點遮罩或右上角X
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;        // 點取消按鈕
  onConfirm?: () => void;       // 點確認按鈕
};

export function ConfirmModal({
  open,
  title,
  description,
  onClose,
  cancelText = '取消編輯',
  confirmText = '繼續編輯',
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* 背景反黑：#0D0D0DB2 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#0D0D0DB2' }}
        onClick={onClose}
        aria-hidden
      />
      {/* 卡片 420x220、圓角8、白底 */}
      <div
        className="
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[420px] min-h-[220px] rounded-[8px] bg-white shadow-xl
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
            className="absolute right-3 top-3 text-black/60 hover:text-black/90"
          >
            ✕
          </button>

          {/* 標題 */}
          {title && (
            <h3
              className="text-[20px] leading-6 text-center text-black-900 font-medium"
            >
              {title}
            </h3>
          )}

          {description && (
            <p
              className="text-[16px] leading-6 text-center text-black-900"
            >
              {description}
            </p>
          )}

          {/* 按鈕組：兩個按鈕並排 */}
          <div className="flex gap-[10px]">
            {/* 取消按鈕：白底橘框 */}
            <Button
              variant="small"
              onClick={onCancel ?? onClose}
              className="w-[120px] bg-white border border-primary-900 text-primary-900 rounded-lg text-base"
            >
              {cancelText}
            </Button>
            
            {/* 確認按鈕：橘底白字 */}
            <Button
              variant="small"
              onClick={onConfirm ?? onClose}
              className="w-[120px] bg-primary-900 text-white rounded-lg font-bold text-base"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
