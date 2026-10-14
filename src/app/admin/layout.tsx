'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';

/**
 * 後台殼層：admin.enter guard（§7.2）。導覽已移到全站側欄。
 * 沒有 admin.enter 一律導回教案平台首頁；真正的擋在後端。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  return <section className="w-full pb-16">{children}</section>;
}
