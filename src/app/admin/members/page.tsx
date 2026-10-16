'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { PageHead } from '@/components/layout/PageHead';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { BulkActionBar } from '@/features/review-shared/BulkActionBar';
import { MemberTable } from '@/features/admin/members/MemberTable';
import {
  MemberBatchDialog,
  MemberEditDialog,
  type BatchValue,
  type MemberFormValue,
} from '@/features/admin/members/MemberDialogs';
import { BTN, BTN_PRIMARY, BTN_SM } from '@/lib/button-styles';
import {
  cloneMembersFromTerm,
  fetchFamilies,
  fetchMembers,
  fetchTerms,
  patchMembers,
  upsertMembers,
  type FamilyRow,
  type MemberRow,
  type MemberUpsertInput,
  type TermRow,
} from '@/services/review';

type Notice = { type: 'success' | 'error'; title: string; message?: string };

const CONTROL =
  "rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px] text-black-900";

/** 成員管理（v13 `renderAdminMembers()`）：依期別與家別管理身分，同一人可有多個角色。 */
export default function AdminMembersPage() {
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [query, setQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<MemberRow | 'new' | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [cloneFrom, setCloneFrom] = useState('');

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      setRows(await fetchMembers(termId));
    } catch (err) {
      setNotice({ type: 'error', title: '無法取得成員', message: err instanceof Error ? err.message : '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [termId]);

  useEffect(() => {
    void reload();
    void fetchFamilies().then(setFamilies).catch(() => setFamilies([]));
    void fetchTerms().then(setTerms).catch(() => setTerms([]));
  }, [reload]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (familyFilter && row.family_id !== familyFilter) return false;
      return !keyword || `${row.name} ${row.email}`.toLowerCase().includes(keyword);
    });
  }, [familyFilter, query, rows]);

  /** 執行一個寫入動作；成功回傳 true。 */
  const run = async (action: () => Promise<unknown>, success: string, message?: string) => {
    setWorking(true);
    try {
      await action();
      await reload();
      setNotice({ type: 'success', title: success, message });
      return true;
    } catch (err) {
      setNotice({ type: 'error', title: '操作失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
      return false;
    } finally {
      setWorking(false);
    }
  };

  /**
   * 後端的 upsert 只會新增角色、更換家別，不會撤銷角色，所以：
   * 新勾的角色走 upsert，取消勾選的走 patch revoke_roles。
   */
  const handleSave = async (value: MemberFormValue) => {
    if (!termId) return;
    const member = editing === 'new' ? null : editing;
    const existing = new Set(member?.roles.map((role) => role.role) ?? []);
    const added = [...value.roles].filter((role) => !existing.has(role));
    const revoked = member?.roles.filter((role) => !value.roles.has(role.role)) ?? [];

    // 後端：既有成員的 name 去空白後非空且不同才會更新，空字串視為不變更
    const nameChanged = !!member && !!value.name.trim() && value.name.trim() !== member.name;

    const ok = await run(async () => {
      if (!member || added.length > 0 || nameChanged || member.family_id !== value.familyId) {
        await upsertMembers(termId, [
          {
            email: value.email.trim(),
            name: value.name.trim(),
            family_id: value.familyId,
            roles: added.map((role) => ({ role, family_id: value.familyId })),
          },
        ]);
      }
      if (member && revoked.length > 0) {
        await patchMembers(termId, [
          { user_id: member.user_id, revoke_roles: revoked.map((role) => ({ role: role.role, family_id: role.family_id ?? null })) },
        ]);
      }
    }, member ? '成員已更新' : '已加入成員');
    if (ok) setEditing(null);
  };

  const handleBatch = async (value: BatchValue) => {
    if (!termId) return;
    const targets = rows.filter((row) => selected.has(row.user_id));
    const items: MemberUpsertInput[] = [];
    let skipped = 0;
    for (const row of targets) {
      const familyId = value.familyId || row.family_id;
      if (!familyId) {
        skipped += 1;
        continue;
      }
      const addRole = value.addRole && !row.roles.some((role) => role.role === value.addRole) ? [value.addRole] : [];
      if (familyId === row.family_id && addRole.length === 0) continue;
      items.push({
        email: row.email,
        name: row.name,
        family_id: familyId,
        roles: addRole.map((role) => ({ role, family_id: familyId })),
      });
    }
    if (items.length === 0) {
      setBatchOpen(false);
      setNotice({ type: 'error', title: '沒有需要變更的成員', message: skipped ? `${skipped} 位沒有本期家別，已略過。` : undefined });
      return;
    }
    const ok = await run(
      () => upsertMembers(termId, items),
      `已更新 ${items.length} 位成員`,
      skipped ? `${skipped} 位沒有本期家別，已略過。` : undefined
    );
    if (ok) {
      setBatchOpen(false);
      setSelected(new Set());
    }
  };

  return (
    <div>
      <PageHead
        title="成員管理"
        subtitle={`${context?.current_term?.label ? `${context.current_term.label}・` : ''}依期別與家別管理成員身份；同一位成員可以同時擁有多個角色。`}
        actions={
          <button type="button" className={BTN_PRIMARY} onClick={() => setEditing('new')}>
            ＋ 新增成員
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-[10px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋姓名或信箱…"
          className={`${CONTROL} min-w-[240px] flex-1 outline-none focus:border-primary-700`}
        />
        <select value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)} className={CONTROL}>
          <option value="">全部家別</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <select value={cloneFrom} onChange={(event) => setCloneFrom(event.target.value)} className={CONTROL}>
            <option value="">複製哪一期的角色…</option>
            {terms
              .filter((term) => term.id !== termId)
              .map((term) => (
                <option key={term.id} value={term.id}>
                  {term.label}
                </option>
              ))}
          </select>
          <button
            type="button"
            className={BTN}
            disabled={!cloneFrom || !termId || working}
            onClick={() => cloneFrom && termId && void run(() => cloneMembersFromTerm(cloneFrom, termId), '已複製上期角色')}
          >
            複製到本期
          </button>
        </span>
      </div>

      <BulkActionBar
        variant="inline"
        summary={
          <>
            <span className="font-bold text-black-900">已選 {selected.size} 位成員</span>
            <span className="ml-2 text-[12px]">可批量調整家別與新增角色</span>
          </>
        }
      >
        <button
          type="button"
          className={`${BTN} ${BTN_SM}`}
          onClick={() => setSelected(new Set())}
          disabled={selected.size === 0}
        >
          取消選取
        </button>
        <button
          type="button"
          className={`${BTN_PRIMARY} ${BTN_SM}`}
          onClick={() => setBatchOpen(true)}
          disabled={selected.size === 0}
        >
          批量編輯
        </button>
      </BulkActionBar>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : (
        <MemberTable
          rows={visible}
          selected={selected}
          onToggle={(userId, checked) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (checked) next.add(userId);
              else next.delete(userId);
              return next;
            })
          }
          onToggleAll={(checked) => setSelected(checked ? new Set(visible.map((row) => row.user_id)) : new Set())}
          onEdit={setEditing}
        />
      )}
      <p className="mt-2 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        每位成員都必須指定本期家別；帳戶不提供啟用或停用設定。
      </p>

      <MemberEditDialog
        open={editing !== null}
        member={editing === 'new' ? null : editing}
        families={families}
        working={working}
        onClose={() => setEditing(null)}
        onSave={(value) => void handleSave(value)}
      />
      <MemberBatchDialog
        open={batchOpen}
        count={selected.size}
        families={families}
        working={working}
        onClose={() => setBatchOpen(false)}
        onApply={(value) => void handleBatch(value)}
      />

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
