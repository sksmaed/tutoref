'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { ADMIN_SECTIONS } from '@/features/review-shared/sections';

/**
 * 後台殼層：側邊選單 + admin.enter guard（§3.2 / §7.2）。
 * 沒有 admin.enter 一律導回教案平台首頁；真正的擋在後端。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: authLoading, authenticated } = useAuth();
  const { context, loading } = useTermContext();

  const allowed = !!context?.capabilities?.includes('admin.enter');

  useEffect(() => {
    if (authLoading || loading) return;
    if (!authenticated) {
      router.replace('/login');
      return;
    }
    if (!allowed) router.replace('/');
  }, [allowed, authLoading, authenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
      </div>
    );
  }

  if (!authenticated || !allowed) return null;

  const sections = ADMIN_SECTIONS.filter((section) =>
    context?.capabilities?.includes(section.capability)
  );

  return (
    <section className="mx-auto mt-10 mb-16 w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-['Noto_Sans_TC'] text-[20px] font-bold leading-[150%] text-black-900 sm:text-[25px]">
          後台管理
        </h1>
        {context?.current_term && (
          <span className="font-['Noto_Sans_TC'] text-[16px] text-black-700">
            {context.current_term.label}
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <nav className="w-full shrink-0 md:w-[200px]">
          <ul className="flex flex-row flex-wrap gap-2 md:flex-col">
            {sections.map((section) => {
              const active = pathname?.startsWith(section.href);
              const base =
                "rounded-lg px-4 py-2 font-['Noto_Sans_TC'] text-[15px] block w-full text-left";
              if (!section.available) {
                return (
                  <li key={section.key}>
                    <span className={`${base} cursor-not-allowed bg-black-100 text-status-idle`}>
                      {section.label}
                      <span className="ml-2 text-[13px]">尚未開放</span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={section.key}>
                  <Link
                    href={section.href}
                    className={`${base} ${active ? 'bg-primary-100 text-primary-900 font-bold' : 'bg-white text-black-900 hover:bg-primary-100'}`}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
