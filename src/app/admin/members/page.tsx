'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/toast';
import { Checkbox } from '@/components/ui/Checkbox';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { MemberTable } from '@/features/admin/members/MemberTable';
import {
  cloneMembersFromTerm,
  fetchFamilies,
  fetchMembers,
  fetchTerms,
  patchMembers,
  upsertMembers,
  type FamilyRow,
  type MemberRow,
  type TermRow,
} from '@/services/review';

const ROLES = [
  { value: 'leader', label: '組長（期別）' },
  { value: 'reviewer', label: '驗收者（期別）' },
  { value: 'parent', label: '家長（家別）' },
  { value: 'writer', label: '撰寫者（家別）' },
];

const FAMILY_SCOPED = new Set(['parent', 'writer']);

export default function AdminMembersPage() {
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [cloneFrom, setCloneFrom] = useState('');

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      setRows(await fetchMembers(termId));
    } catch (err) {
      setNotice({
        type: 'error',
        title: '無法取得成員',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setLoading(false);
    }
  }, [termId]);

  useEffect(() => {
    void reload();
    void fetchFamilies().then(setFamilies).catch(() => setFamilies([]));
    void fetchTerms().then(setTerms).catch(() => setTerms([]));
  }, [reload]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setWorking(true);
    try {
      await action();
      await reload();
      setNotice({ type: 'success', title: success });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '操作失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setWorking(false);
    }
  };

  const handleAdd = () => {
    if (!termId || !email.trim()) return;
    void run(
      () =>
        upsertMembers(termId, [
          {
            email: email.trim(),
            name: name.trim(),
            family_id: familyId || null,
            roles: [...roles].map((role) => ({
              role,
              family_id: FAMILY_SCOPED.has(role) ? familyId || null : null,
            })),
          },
        ]),
      '已加入成員'
    ).then(() => {
      setAddOpen(false);
      setEmail('');
      setName('');
      setFamilyId('');
      setRoles(new Set());
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-['Noto_Sans_TC'] text-[18px] font-bold text-black-900">成員管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cloneFrom}
            onChange={(event) => setCloneFrom(event.target.value)}
            className="rounded-lg border border-black-200 px-2 py-1 text-[14px]"
          >
            <option value="">複製哪一期的角色…</option>
            {terms
              .filter((term) => term.id !== termId)
              .map((term) => (
                <option key={term.id} value={term.id}>
                  {term.label}
                </option>
              ))}
          </select>
          <Button
            onClick={() =>
              cloneFrom && termId
                ? void run(() => cloneMembersFromTerm(cloneFrom, termId), '已複製上期角色')
                : undefined
            }
            disabled={!cloneFrom || working}
            className="border border-primary-900 bg-white px-4 py-1 text-primary-900"
          >
            複製到本期
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary-900 px-4 py-1 font-bold text-white"
          >
            新增成員
          </Button>
        </div>
      </div>
      <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700">
        以 email 為準；沒有帳號的人會建立一個尚未設定密碼的帳號，之後由本人設定密碼。
      </p>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : (
        <MemberTable
          rows={rows}
          working={working}
          onToggleActive={(row) =>
            void run(
              () => patchMembers(termId!, [{ user_id: row.user_id, membership_active: !row.membership_active }]),
              row.membership_active ? '已停用' : '已啟用'
            )
          }
          onRevokeRole={(row, role) =>
            void run(
              () => patchMembers(termId!, [{ user_id: row.user_id, revoke_roles: [role] }]),
              '已撤銷角色'
            )
          }
        />
      )}

      {addOpen && (
        <div className="fixed inset-0 z-1000">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: '#0D0D0DB2' }}
            onClick={() => setAddOpen(false)}
            aria-hidden
          />
          <div className="absolute left-1/2 top-1/2 w-[min(460px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-white px-8 py-6 shadow-xl">
            <h3 className="text-center font-['Noto_Sans_TC'] text-[18px] font-medium text-black-900">
              新增成員
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email（必填）"
                className="rounded-lg border border-black-200 px-3 py-2 text-[14px]"
              />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="姓名"
                className="rounded-lg border border-black-200 px-3 py-2 text-[14px]"
              />
              <select
                value={familyId}
                onChange={(event) => setFamilyId(event.target.value)}
                className="rounded-lg border border-black-200 px-3 py-2 text-[14px]"
              >
                <option value="">選擇家別</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ROLES.map((role) => (
                  <Checkbox
                    key={role.value}
                    checked={roles.has(role.value)}
                    onChange={(next) =>
                      setRoles((prev) => {
                        const updated = new Set(prev);
                        if (next) updated.add(role.value);
                        else updated.delete(role.value);
                        return updated;
                      })
                    }
                    label={role.label}
                  />
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-center gap-[10px]">
              <Button
                onClick={() => setAddOpen(false)}
                className="w-[110px] rounded-lg border border-primary-900 bg-white py-2 text-primary-900"
              >
                取消
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!email.trim() || working}
                className="w-[110px] rounded-lg bg-primary-900 py-2 font-bold text-white"
              >
                加入
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast
        open={!!notice}
        type={notice?.type}
        title={notice?.title ?? ''}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />
    </div>
  );
}
