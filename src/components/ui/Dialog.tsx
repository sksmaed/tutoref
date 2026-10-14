'use client';

import React, { useEffect, useRef, useState } from 'react';

const openStack: symbol[] = [];

const SIZE_CLASS = {
  sm: 'max-w-[500px]',
  md: 'max-w-[760px]',
  lg: 'max-w-[1040px]',
} as const;

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** 標題上方的小字，例如「26 夏・初驗・新武」。 */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** 標題下方的說明。 */
  subtitle?: React.ReactNode;
  size?: keyof typeof SIZE_CLASS;
  /** 底部按鈕列（靠右）。 */
  footer?: React.ReactNode;
  /** 進行中時不允許關閉（例如送出中）。 */
  busy?: boolean;
  children: React.ReactNode;
}

/** v13 `.modal`：標題列與按鈕列固定，內容區捲動。點遮罩或按 Esc 關閉。 */
export function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  size = 'md',
  footer,
  busy = false,
  children,
}: DialogProps) {
  // 疊兩層 Dialog 時（例如上傳視窗開在教案視窗上），Esc 只關最上層
  // onClose / busy 放 ref：父層每次 render 都給新的 onClose，不能因此重排堆疊順序
  const [id] = useState(() => Symbol('dialog'));
  const latest = useRef({ onClose, busy });
  latest.current = { onClose, busy };
  useEffect(() => {
    if (!open) return;
    openStack.push(id);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || latest.current.busy) return;
      if (openStack[openStack.length - 1] === id) latest.current.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const index = openStack.lastIndexOf(id);
      if (index >= 0) openStack.splice(index, 1);
    };
  }, [open, id]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black-900/40 p-4 sm:p-[30px]"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.25)] ${SIZE_CLASS[size]}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black-200 px-5 py-[18px]">
          <div className="min-w-0 font-['Noto_Sans_TC']">
            {eyebrow && <p className="text-[12px] text-black-500">{eyebrow}</p>}
            <p className="text-[17px] font-bold leading-[150%] text-black-900">{title}</p>
            {subtitle && <p className="mt-[2px] text-[12px] text-black-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="關閉"
            className="shrink-0 cursor-pointer px-[6px] py-[3px] text-[22px] leading-none text-black-500 hover:text-black-900 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black-200 px-5 py-[14px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** 標籤／值兩欄（v13 `.kv`）。 */
export function KeyValueList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-[18px] gap-y-[10px] font-['Noto_Sans_TC'] text-[14px] sm:grid-cols-[150px_1fr]">
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <dt className="text-black-500">{item.label}</dt>
          <dd className="font-medium text-black-900">{item.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
