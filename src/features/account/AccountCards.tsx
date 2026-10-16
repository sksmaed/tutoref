'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { KeyValueList } from '@/components/ui/Dialog';
import { ROLE_LABEL } from '@/components/layout/user-display';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { TermContext } from '@/features/review-shared/types';
import type { UserResp } from '@/services/auth';

/** 基本資訊（v13 `renderAccount()`）。姓名可改，email 不開放自行修改。 */
export function ProfileCard({
  user,
  editing,
  name,
  onNameChange,
  error,
}: {
  user: UserResp | null;
  editing: boolean;
  name: string;
  onNameChange: (value: string) => void;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader title="基本資訊" />
      {editing ? (
        <div className="grid grid-cols-1 gap-[14px]">
          <label className="block">
            <span className="mb-[6px] block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700">姓名</span>
            <input
              autoFocus
              value={name}
              maxLength={255}
              onChange={(event) => onNameChange(event.target.value)}
              className="w-full rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px] outline-none focus:border-primary-700"
            />
            {error && <span className="mt-1 block text-[12px] text-status-alert">{error}</span>}
          </label>
          <label className="block">
            <span className="mb-[6px] block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700">信箱</span>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-[10px] border border-black-200 bg-black-100 px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px] text-black-500"
            />
            <span className="mt-1 block text-[11px] text-black-500">信箱不開放自行修改。</span>
          </label>
        </div>
      ) : (
        <KeyValueList
          items={[
            { label: '姓名', value: user?.name?.trim() || <span className="text-black-500">尚未填寫</span> },
            { label: '信箱', value: user?.email ?? '—' },
          ]}
        />
      )}
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
