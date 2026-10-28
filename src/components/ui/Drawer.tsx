'use client';

import React, { useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** 標題上方的小字，例如「初驗驗收者工作量」。 */
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}

/** 右側抽屜（v13 `.drawer`）。點遮罩或按 Esc 關閉。 */
export function Drawer({ open, onClose, eyebrow, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95]">
      <div className="absolute inset-0 bg-black-900/25" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute bottom-0 right-0 top-0 w-[min(620px,92vw)] overflow-auto border-l border-black-200 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.12)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black-200 bg-white px-5 py-[18px]">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-['Noto_Sans_TC'] text-[12px] text-black-500">{eyebrow}</p>
            )}
            <p className="font-['Noto_Sans_TC'] text-[18px] font-bold text-black-900">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="cursor-pointer px-[6px] py-[3px] text-[22px] leading-none text-black-500 hover:text-black-900"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}
