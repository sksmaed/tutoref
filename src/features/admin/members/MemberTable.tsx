'use client';

import React from 'react';
import { ROLE_LABEL } from '@/components/layout/user-display';
import { BTN, BTN_SM } from '@/lib/button-styles';
import { TABLE, TABLE_WRAP, TD, TD_CHECKBOX, TH, TH_CHECKBOX, TR } from '@/lib/table-styles';
import type { MemberRow } from '@/services/review';

interface MemberTableProps {
  rows: MemberRow[];
  selected: Set<string>;
  onToggle: (userId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (row: MemberRow) => void;
}

/** 成員清單（v13 `renderAdminMembers()`）：同一位成員可以同時擁有多個角色。 */
export const MemberTable: React.FC<MemberTableProps> = ({ rows, selected, onToggle, onToggleAll, onEdit }) => {
  const allChecked = rows.length > 0 && rows.every((row) => selected.has(row.user_id));
  return (
    <div className={TABLE_WRAP}>
      <table className={`${TABLE} min-w-[720px]`}>
        <thead>
          <tr>
            <th className={TH_CHECKBOX}>
              <input
                type="checkbox"
                aria-label="全選"
                className="h-4 w-4 accent-primary-900"
                checked={allChecked}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </th>
            <th className={TH}>姓名</th>
            <th className={TH}>信箱</th>
            <th className={TH}>家別</th>
            <th className={TH}>角色</th>
            <th className={TH} aria-label="動作" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-[14px] text-black-500">
                沒有符合條件的成員。
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.user_id} className={TR}>
                <td className={TD_CHECKBOX}>
                  <input
                    type="checkbox"
                    aria-label={`選取 ${row.name || row.email}`}
                    className="h-4 w-4 accent-primary-900"
                    checked={selected.has(row.user_id)}
                    onChange={(event) => onToggle(row.user_id, event.target.checked)}
                  />
                </td>
                <td className={`${TD} font-bold`}>{row.name || '（未填姓名）'}</td>
                <td className={`${TD} text-[12px] text-black-500`}>{row.email}</td>
                <td className={TD}>{row.family_name ?? '—'}</td>
                <td className={TD}>
                  {row.roles.length === 0 ? (
                    <span className="text-black-500">—</span>
                  ) : (
                    <span className="flex flex-wrap gap-[7px]">
                      {row.roles.map((role) => (
                        <span
                          key={`${role.role}-${role.family_id ?? 'term'}`}
                          className="rounded-lg bg-black-100 px-2 py-[5px] text-[11px] text-black-700"
                        >
                          {ROLE_LABEL[role.role] ?? role.role}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td className={`${TD} text-right`}>
                  <button type="button" className={`${BTN} ${BTN_SM}`} onClick={() => onEdit(row)}>
                    編輯
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
