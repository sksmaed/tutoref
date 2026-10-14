'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { KeyValueList } from '@/components/ui/Dialog';
import { ROLE_LABEL, displayName } from '@/components/layout/user-display';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { TermContext } from '@/features/review-shared/types';
import type { UserResp } from '@/services/auth';

/** 基本資訊（v13 `renderAccount()`）。後端尚未提供修改個人資料的 API，先做唯讀。 */
export function ProfileCard({ user }: { user: UserResp | null }) {
  return (
    <Card>
      <CardHeader title="基本資訊" />
      <KeyValueList
        items={[
          { label: '姓名', value: displayName(user) || '—' },
          { label: '信箱', value: user?.email ?? '—' },
        ]}
      />
      <p className="mt-4 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        目前還不能在網站上修改個人資料；如需更正姓名，請聯絡教案組。
      </p>
    </Card>
  );
}

/** 本期身份（v13 `identityCard()`）：期別、家別與角色由教案組在成員管理維護。 */
export function IdentityCard({ context }: { context: TermContext | null }) {
  const roles = Array.from(new Set((context?.roles ?? []).map((role) => ROLE_LABEL[role.role] ?? role.role)));
  return (
    <Card>
      <CardHeader title="本期身份" description="角色、家別與期別由教案組維護。" />
      <KeyValueList
        items={[
          { label: '期別', value: context?.current_term?.label ?? '—' },
          { label: '家別', value: context?.membership?.family_name ?? '—' },
          {
            label: '角色',
            value: roles.length ? (
              <span className="flex flex-wrap gap-[6px]">
                {roles.map((role) => (
                  <StatusChip key={role} status={role} tone="active" />
                ))}
              </span>
            ) : (
              '本期沒有指派角色'
            ),
          },
        ]}
      />
    </Card>
  );
}
