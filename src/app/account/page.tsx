'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { IdentityCard, ProfileCard } from '@/features/account/AccountCards';
import { useProfileEdit } from '@/features/account/useProfileEdit';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';

/** 設定（v13 `renderAccount()`）：個人基本資料與本期身份。 */
export default function AccountPage() {
  const router = useRouter();
  const { loading, authenticated, user } = useAuth();
  const { context } = useTermContext();
  const profile = useProfileEdit();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !authenticated) router.replace('/login');
  }, [authenticated, loading, router]);

  if (loading || !authenticated) return null;

  return (
    <div className="pb-16">
      <PageHead
        title="設定"
        subtitle={profile.editing ? '修改個人基本資料；角色、家別與期別由教案組維護。' : '檢視個人基本資料；需要修改時再進入編輯模式。'}
        actions={
          profile.editing ? (
            <>
              <button type="button" className={BTN} onClick={profile.cancel} disabled={profile.saving}>
                取消
              </button>
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={profile.saving}
                onClick={async () => {
                  if (await profile.save()) setSaved(true);
                }}
              >
                {profile.saving ? '儲存中…' : '儲存'}
              </button>
            </>
          ) : (
            <button type="button" className={BTN_PRIMARY} onClick={profile.start}>
              編輯
            </button>
          )
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileCard
          user={user}
          editing={profile.editing}
          name={profile.name}
          onNameChange={profile.setName}
          error={profile.error}
        />
        <IdentityCard context={context} />
      </div>

      <Toast open={saved} type="success" title="設定已儲存" onClose={() => setSaved(false)} />
    </div>
  );
}
