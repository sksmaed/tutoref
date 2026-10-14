'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { PageHead } from '@/components/layout/PageHead';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { BulkActionBar } from '@/features/review-shared/BulkActionBar';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { useRound } from '@/features/review-shared/RoundTabs';
import { BTN, BTN_PRIMARY, BTN_SM } from '@/lib/button-styles';
import { TABLE, TABLE_WRAP, TD, TD_CHECKBOX, TH, TH_CHECKBOX, TR } from '@/lib/table-styles';
import {
  fetchFamilies,
  fetchFamilyPlansFor,
  setPlanExcellent,
  type FamilyPlan,
  type FamilyRow,
} from '@/services/review';

interface PlanRow extends FamilyPlan {
  family_id: string;
  family_name: string;
}

type Notice = { type: 'success' | 'error'; title: string; message?: string };

const EDITING_STATUS_LABEL: Record<string, string> = {
  draft: '撰寫中',
  submitted_initial: '初驗已送件',
  feedback_required: '待處理回饋',
  ready_for_final: '總驗準備中',
  final_submitted: '總驗已送件',
  locked: '已鎖定',
};

const CONTROL =
  "rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px] text-black-900";

/**
 * 教案管理（v13 `renderAdminLessons()`）：全團本期教案與優良標記。
 * 後端目前只開放「優良教案」這一個可批量改的欄位。
 */
export default function AdminPlansPage() {
  const round = useRound();
  const { context } = useTermContext();
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [query, setQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const familyRows: FamilyRow[] = await fetchFamilies();
      setFamilies(familyRows);
      // family-plans 是一次一家，六家就六個請求；一期只有 60–100 份，值不回票價的是快取
      const lists = await Promise.all(familyRows.map((family) => fetchFamilyPlansFor(family.id, round)));
      setRows(
        familyRows.flatMap((family, index) =>
          lists[index].map((plan) => ({ ...plan, family_id: family.id, family_name: family.name }))
        )
      );
    } catch (err) {
      setNotice({ type: 'error', title: '無法取得教案', message: err instanceof Error ? err.message : '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [round]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (familyFilter && row.family_id !== familyFilter) return false;
      if (statusFilter === 'excellent' && !row.is_excellent) return false;
      if (statusFilter && statusFilter !== 'excellent' && row.editing_status !== statusFilter) return false;
      return !keyword || `${row.tp_name} ${row.writer_names.join(' ')}`.toLowerCase().includes(keyword);
    });
  }, [familyFilter, query, rows, statusFilter]);

  /** 逐份呼叫，回傳失敗的教案名稱。 */
  const applyExcellent = async (targets: PlanRow[], value: boolean) => {
    const changes = targets.filter((row) => row.is_excellent !== value);
    if (changes.length === 0) {
      setNotice({ type: 'error', title: '沒有需要變更的教案' });
      return;
    }
    setWorking(true);
    const failed: string[] = [];
    for (const row of changes) {
      try {
        await setPlanExcellent(row.plan_id, value);
        setRows((prev) => prev.map((item) => (item.plan_id === row.plan_id ? { ...item, is_excellent: value } : item)));
      } catch {
        failed.push(row.tp_name);
      }
    }
    setWorking(false);
    setSelected(new Set());
    setNotice(
      failed.length
        ? { type: 'error', title: `${failed.length} 份未更新`, message: failed.join('、') }
        : { type: 'success', title: value ? '已標記為優良教案' : '已取消優良標記', message: `共 ${changes.length} 份。` }
    );
  };

  const allChecked = visible.length > 0 && visible.every((row) => selected.has(row.plan_id));

  return (
    <div>
      <PageHead
        title="教案管理"
        subtitle={`${context?.current_term?.label ?? ''} 全團共 ${rows.length} 份；查看教案狀態與優良標記。`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-[10px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋教案或作者…"
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
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={CONTROL}>
          <option value="">全部狀態</option>
          {Object.entries(EDITING_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
          <option value="excellent">優良教案</option>
        </select>
      </div>

      <BulkActionBar
        variant="inline"
        summary={
          <>
            <span className="font-bold text-black-900">已選 {selected.size} 份教案</span>
            <span className="ml-2 text-[12px]">可批量調整優良教案標記</span>
          </>
        }
      >
        <button type="button" className={`${BTN} ${BTN_SM}`} onClick={() => setSelected(new Set())} disabled={selected.size === 0}>
          取消選取
        </button>
        <button
          type="button"
          className={`${BTN} ${BTN_SM}`}
          disabled={selected.size === 0 || working}
          onClick={() => void applyExcellent(rows.filter((row) => selected.has(row.plan_id)), false)}
        >
          移除優良標記
        </button>
        <button
          type="button"
          className={`${BTN_PRIMARY} ${BTN_SM}`}
          disabled={selected.size === 0 || working}
          onClick={() => void applyExcellent(rows.filter((row) => selected.has(row.plan_id)), true)}
        >
          標記為優良
        </button>
      </BulkActionBar>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={`${TABLE} min-w-[820px]`}>
            <thead>
              <tr>
                <th className={TH_CHECKBOX}>
                  <input
                    type="checkbox"
                    aria-label="全選"
                    className="h-4 w-4 accent-primary-900"
                    checked={allChecked}
                    onChange={(event) =>
                      setSelected(event.target.checked ? new Set(visible.map((row) => row.plan_id)) : new Set())
                    }
                  />
                </th>
                <th className={TH}>教案</th>
                <th className={TH}>作者</th>
                <th className={TH}>家別</th>
                <th className={TH}>狀態</th>
                <th className={TH}>標記</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[14px] text-black-500">
                    沒有符合條件的教案。
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.plan_id} className={TR}>
                    <td className={TD_CHECKBOX}>
                      <input
                        type="checkbox"
                        aria-label={`選取 ${row.tp_name}`}
                        className="h-4 w-4 accent-primary-900"
                        checked={selected.has(row.plan_id)}
                        onChange={(event) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (event.target.checked) next.add(row.plan_id);
                            else next.delete(row.plan_id);
                            return next;
                          })
                        }
                      />
                    </td>
                    <td className={TD}>
                      <p className="font-bold">{row.tp_name}</p>
                      <p className="mt-[2px] text-[12px] text-black-500">
                        {row.category}・{row.grade}・{row.duration} 分鐘
                      </p>
                    </td>
                    <td className={TD}>{row.writer_names.join('、') || '—'}</td>
                    <td className={TD}>{row.family_name}</td>
                    <td className={TD}>
                      <StatusChip
                        status={EDITING_STATUS_LABEL[row.editing_status] ?? row.editing_status}
                        tone={row.editing_status === 'draft' ? 'idle' : row.editing_status === 'locked' ? 'done' : 'active'}
                      />
                    </td>
                    <td className={TD}>
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void applyExcellent([row], !row.is_excellent)}
                        className={`cursor-pointer rounded-full px-[10px] py-[4px] text-[12px] font-bold disabled:cursor-not-allowed ${
                          row.is_excellent
                            ? 'bg-status-done-bg text-status-done'
                            : 'bg-black-100 text-black-500 hover:bg-primary-100'
                        }`}
                      >
                        {row.is_excellent ? '★ 優良教案' : '☆ 標記'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
