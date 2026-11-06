'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { ROLE_LABEL, displayName } from './user-display';

/** 右上角使用者選單（v13 `.user-menu-wrap`）。未登入時顯示登入按鈕。 */
export default function UserMenu() {
  const router = useRouter();
  const { loading, authenticated, user, logout } = useAuth();
  const { context } = useTermContext();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading) return null;

  if (!authenticated) {
    return (
      <Link
        href="/login"
        className="rounded-xl border border-black-200 bg-white px-4 py-[10px] font-['Noto_Sans_TC'] text-[14px] text-primary-900 shadow-[0_5px_16px_rgba(0,0,0,0.08)] hover:bg-primary-100"
      >
        登入 / 註冊
      </Link>
    );
  }

  const name = displayName(user);
  const roles = Array.from(
    new Set((context?.roles ?? []).map((role) => ROLE_LABEL[role.role] ?? role.role))
  );

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="開啟使用者選單"
        className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-full border border-black-200 bg-white font-['Noto_Sans_TC'] text-[15px] font-bold text-black-700 shadow-[0_5px_16px_rgba(0,0,0,0.08)] hover:ring-4 hover:ring-primary-100"
      >
        {name.slice(0, 1)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[50px] w-[220px] rounded-[13px] border border-black-200 bg-white p-[7px] shadow-[0_5px_16px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-[5px] border-b border-black-100 px-[10px] pb-[10px] pt-[9px]">
            <p className="truncate font-['Noto_Sans_TC'] text-[14px] font-bold text-black-900">{name}</p>
            <p className="mt-[2px] truncate font-['Noto_Sans_TC'] text-[12px] text-black-500">
              {roles.length ? roles.join('＋') : user?.email}
            </p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-[9px] rounded-[9px] px-[11px] py-[10px] font-['Noto_Sans_TC'] text-[14px] font-medium text-black-700 hover:bg-black-100"
          >
            <Settings size={16} aria-hidden />
            設定
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-[9px] rounded-[9px] px-[11px] py-[10px] text-left font-['Noto_Sans_TC'] text-[14px] font-medium text-status-alert hover:bg-black-100"
          >
            <LogOut size={16} aria-hidden />
            登出
          </button>
        </div>
      )}
    </div>
  );
}
