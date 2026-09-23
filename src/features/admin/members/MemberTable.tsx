'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { MemberRow } from '@/services/review';

const ROLE_LABEL: Record<string, string> = {
  leader: '組長',
  reviewer: '驗收者',
  parent: '家長',
  writer: '撰寫者',
};

interface MemberTableProps {
  rows: MemberRow[];
  working: boolean;
  onToggleActive: (row: MemberRow) => void;
  onRevokeRole: (row: MemberRow, role: MemberRow['roles'][number]) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({
  rows,
  working,
  onToggleActive,
  onRevokeRole,
}) => (
  <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
    <table className="w-full min-w-[820px] border-collapse text-[14px] font-['Noto_Sans_TC']">
      <thead>
        <tr className="bg-primary-100 font-bold text-black-900">
          <th className="h-[48px] px-4 text-left">成員</th>
          <th className="h-[48px] w-[90px] px-2 text-center">家別</th>
          <th className="h-[48px] px-2 text-left">角色</th>
          <th className="h-[48px] w-[110px] px-2 text-center">本期家別歸屬</th>
          <th className="h-[48px] w-[110px] px-2 text-center">動作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black-200 bg-white">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="h-[80px] text-center text-black-700">
              本期還沒有任何成員。
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.user_id} className="transition-colors hover:bg-primary-100">
              <td className="h-[56px] px-4">
                <span className="block">{row.name || '（未填姓名）'}</span>
                <span className="text-[12px] text-black-500">{row.email}</span>
              </td>
              <td className="h-[56px] px-2 text-center">{row.family_name ?? '—'}</td>
              <td className="h-[56px] px-2">
                {row.roles.length === 0 ? (
                  <span className="text-black-500">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {row.roles.map((role) => (
                      <button
                        key={`${role.role}-${role.family_id ?? 'term'}`}
                        type="button"
                        disabled={working}
                        onClick={() => onRevokeRole(row, role)}
                        title="點一下撤銷這個角色"
                        className="rounded-lg bg-black-100 px-2 py-[2px] text-[13px] text-black-700 hover:bg-status-alert-bg hover:text-status-alert hover:cursor-pointer"
                      >
                        {ROLE_LABEL[role.role] ?? role.role}
                        {' ✕'}
                      </button>
                    ))}
                  </span>
                )}
              </td>
              <td className="h-[56px] px-2 text-center">
                {!row.has_membership ? (
                  <StatusChip status="未分家" tone="idle" />
                ) : (
                  <StatusChip
                    status={row.membership_active ? '在籍' : '已移出'}
                    tone={row.membership_active ? 'done' : 'idle'}
                  />
                )}
              </td>
              <td className="h-[56px] px-2 text-center">
                {!row.has_membership ? (
                  <span
                    className="text-[13px] text-black-500"
                    title="這個人本期還沒有家別，請用「新增成員」指定家別後再調整"
                  >
                    需先分家
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => onToggleActive(row)}
                    className="text-[13px] text-primary-900 hover:opacity-80 hover:cursor-pointer"
                  >
                    {row.membership_active ? '移出本期' : '加回本期'}
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
