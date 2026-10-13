'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { PageHead } from '@/components/layout/PageHead';
import { findActiveItem } from '@/components/layout/nav-config';
import { useNavContext } from '@/components/layout/useNavContext';

/**
 * 驗收區共用殼層：登入 guard + 頁面標題（期別）。
 * 各區塊的切換已移到全站側欄；guard 只負責不畫出用不到的東西，真正的擋在後端。
 */
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: authLoading, authenticated } = useAuth();
  const { context, loading } = useTermContext();
  const navCtx = useNavContext();

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

  const term = context?.current_term;
  const title = findActiveItem(navCtx, pathname)?.label ?? '教案驗收';

  return (
    <section className="w-full pb-16">
      <PageHead
        title={title}
        subtitle={
          term ? (
            <>
              {term.label}
              {term.is_readonly && <span className="ml-2 text-status-locked">（唯讀期別）</span>}
            </>
          ) : undefined
        }
      />
      {children}
    </section>
  );
}
