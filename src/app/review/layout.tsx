'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { REVIEW_SECTIONS } from '@/features/review-shared/sections';

/**
 * 驗收區共用殼層：期別標題 + capability guard（§7.2）。
 *
 * guard 只負責不畫出使用者用不到的東西，真正的擋在後端。
 */
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: authLoading, authenticated } = useAuth();
  const { context, loading } = useTermContext();

  useEffect(() => {
    if (!authLoading && !authenticated) router.replace('/login');
  }, [authLoading, authenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
      </div>
    );
  }

  if (!authenticated) return null;

  const sections = REVIEW_SECTIONS.filter(
    (section) => section.available && context?.capabilities?.includes(section.capability)
  );

  return (
    <section className="mx-auto mt-10 w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-['Noto_Sans_TC'] text-[20px] font-bold leading-[150%] text-black-900 sm:text-[25px]">
          教案驗收
        </h1>
        {context?.current_term && (
          <span className="font-['Noto_Sans_TC'] text-[16px] text-black-700">
            {context.current_term.label}
            {context.current_term.is_readonly && (
              <span className="ml-2 text-[14px] text-status-locked">（唯讀期別）</span>
            )}
          </span>
        )}
      </div>
      {/* 一個人可能同時是家長 / reviewer / 撰寫者，沒有這排就只進得去預設的那一頁 */}
      {sections.length > 1 && (
        <nav className="mt-4 flex flex-wrap gap-2">
          {sections.map((section) => {
            const active = pathname?.startsWith(section.href);
            return (
              <Link
                key={section.key}
                href={section.href}
                className={`rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${
                  active ? 'bg-primary-900 text-white' : 'bg-white text-black-700 hover:bg-primary-100'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
      )}

      {children}
    </section>
  );
}
