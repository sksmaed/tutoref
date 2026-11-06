'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Footer from './Footer';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';

/**
 * 全站版面（v13）：左側浮動側欄 + 右上使用者選單 + 內容 + Footer。
 * 手機版側欄收成左上角的選單按鈕。
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[44] bg-black-900/30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        aria-label={mobileOpen ? '關閉導覽選單' : '開啟導覽選單'}
        aria-expanded={mobileOpen}
        className="fixed left-2.5 top-2.5 z-[46] flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-xl border border-black-200 bg-white shadow-[0_5px_16px_rgba(0,0,0,0.08)] md:hidden"
      >
        {mobileOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>

      <div className="fixed right-2.5 top-2.5 z-40 md:right-6 md:top-5">
        <UserMenu />
      </div>

      <div className="flex min-h-screen flex-col md:ml-[246px]">
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-[64px] md:px-[34px] md:pb-[70px] md:pt-5">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
