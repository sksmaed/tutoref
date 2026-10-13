'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';

/**
 * 驗收區共用殼層：登入 guard。各區塊的切換在全站側欄，頁面標題由各頁的 TermPageHead 負責。
 * guard 只負責不畫出用不到的東西，真正的擋在後端。
 */
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading: authLoading, authenticated } = useAuth();
  const { loading } = useTermContext();

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

  return <section className="w-full pb-16">{children}</section>;
}
