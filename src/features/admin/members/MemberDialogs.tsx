'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { ROLE_LABEL } from '@/components/layout/user-display';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
import type { FamilyRow, MemberRow } from '@/services/review';

/** 可指派的角色；順序即畫面順序。 */
export const MEMBER_ROLES = ['writer', 'reviewer', 'parent', 'leader'] as const;

const LABEL = "mb-[6px] block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700";
const INPUT =
  "w-full rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px] text-black-900 disabled:bg-black-100 disabled:text-black-500";

export interface MemberFormValue {
  email: string;
  name: string;
  familyId: string;
  roles: Set<string>;
}

interface MemberEditDialogProps {
  open: boolean;
  /** null = 新增成員。 */
  member: MemberRow | null;
  families: FamilyRow[];
  working: boolean;
  onClose: () => void;
  onSave: (value: MemberFormValue) => void;
}

/** 新增 / 編輯成員（v13 `openMemberEdit()`）。角色可複選。 */
export function MemberEditDialog({ open, member, families, working, onClose, onSave }: MemberEditDialogProps) {
  const [value, setValue] = useState<MemberFormValue>({ email: '', name: '', familyId: '', roles: new Set() });

  useEffect(() => {
    if (!open) return;
    setValue({
      email: member?.email ?? '',
      name: member?.name ?? '',
      familyId: member?.family_id ?? '',
      roles: new Set(member?.roles.map((role) => role.role) ?? []),
    });
  }, [open, member]);

  const toggleRole = (role: string, checked: boolean) =>
    setValue((prev) => {
      const roles = new Set(prev.roles);
      if (checked) roles.add(role);
      else roles.delete(role);
      return { ...prev, roles };
    });

  const canSave = !!value.email.trim() && !!value.familyId && !working;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={working}
      size="md"
      title={member ? '編輯成員' : '新增成員'}
      subtitle={member ? member.email : '以 email 為準；沒有帳號的人會建立尚未設定密碼的帳號，之後由本人設定密碼。'}
      footer={
        <>
          <button type="button" className={BTN} onClick={onClose} disabled={working}>
            取消
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={() => onSave(value)} disabled={!canSave}>
            {working ? '儲存中…' : member ? '儲存' : '加入'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>姓名</span>
          <input
            className={INPUT}
            value={value.name}
            disabled={!!member}
            onChange={(event) => setValue((prev) => ({ ...prev, name: event.target.value }))}
          />
          {member && <span className="mt-1 block text-[11px] text-black-500">已有帳號的成員，姓名無法在這裡修改。</span>}
        </label>
        <label className="block">
          <span className={LABEL}>信箱（必填）</span>
          <input
            type="email"
            className={INPUT}
            value={value.email}
            disabled={!!member}
            onChange={(event) => setValue((prev) => ({ ...prev, email: event.target.value }))}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>本期家別（必填）</span>
          <select
            className={INPUT}
            value={value.familyId}
            onChange={(event) => setValue((prev) => ({ ...prev, familyId: event.target.value }))}
          >
            <option value="">選擇家別</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
          {!value.familyId && <span className="mt-1 block text-[12px] text-status-alert">所有成員都必須選擇家別。</span>}
        </label>
        <fieldset className="sm:col-span-2">
          <legend className={LABEL}>角色（可複選）</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {MEMBER_ROLES.map((role) => (
              <label key={role} className="flex cursor-pointer items-center gap-2 font-['Noto_Sans_TC'] text-[14px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary-900"
                  checked={value.roles.has(role)}
                  onChange={(event) => toggleRole(role, event.target.checked)}
                />
                {ROLE_LABEL[role]}
              </label>
            ))}
          </div>
          {member && (
            <span className="mt-2 block text-[12px] text-black-500">取消勾選會撤銷該角色，已有的驗收紀錄會保留。</span>
          )}
        </fieldset>
      </div>
    </Dialog>
  );
}

export interface BatchValue {
  familyId: string;
  addRole: string;
}

interface MemberBatchDialogProps {
  open: boolean;
  count: number;
  families: FamilyRow[];
  working: boolean;
  onClose: () => void;
  onApply: (value: BatchValue) => void;
}

/** 批量編輯成員（v13 `openBatchMemberEdit()`）：變更家別、新增角色。 */
export function MemberBatchDialog({ open, count, families, working, onClose, onApply }: MemberBatchDialogProps) {
  const [value, setValue] = useState<BatchValue>({ familyId: '', addRole: '' });

  useEffect(() => {
    if (open) setValue({ familyId: '', addRole: '' });
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={working}
      size="sm"
      title="批量編輯成員"
      subtitle={`已選 ${count} 位`}
      footer={
        <>
          <button type="button" className={BTN} onClick={onClose} disabled={working}>
            取消
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => onApply(value)}
            disabled={working || (!value.familyId && !value.addRole)}
          >
            {working ? '套用中…' : '套用'}
          </button>
        </>
      }
    >
      <label className="block">
        <span className={LABEL}>家別</span>
        <select
          className={INPUT}
          value={value.familyId}
          onChange={(event) => setValue((prev) => ({ ...prev, familyId: event.target.value }))}
        >
          <option value="">不變更</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block">
        <span className={LABEL}>新增角色</span>
        <select
          className={INPUT}
          value={value.addRole}
          onChange={(event) => setValue((prev) => ({ ...prev, addRole: event.target.value }))}
        >
          <option value="">不新增</option>
          {MEMBER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        沒有本期家別的成員必須選一個家別才能新增角色，否則會略過。撤銷角色請逐位編輯。
      </p>
    </Dialog>
  );
}
