'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { IdentityCard, ProfileCard } from '@/features/account/AccountCards';

/** 設定（v13 `renderAccount()`）：個人基本資料與本期身份。 */
export default function AccountPage() {
  const router = useRouter();
  const { loading, authenticated, user } = useAuth();
  const { context } = useTermContext();

  useEffect(() => {
    if (!loading && !authenticated) router.replace('/login');
  }, [authenticated, loading, router]);

  if (loading || !authenticated) return null;

  return (
    <div className="pb-16">
      <PageHead title="設定" subtitle="檢視個人基本資料與本期身份。" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileCard user={user} />
        <IdentityCard context={context} />
      </div>
    </div>
  );
}
