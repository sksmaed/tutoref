'use client';

import { useCallback, useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { useRound } from '@/features/review-shared/RoundTabs';
import {
  fetchFamilies,
  fetchFamilyPlansFor,
  setPlanExcellent,
  type FamilyPlan,
  type FamilyRow,
} from '@/services/review';

interface PlanRow extends FamilyPlan {
  family_name: string;
}

const EDITING_STATUS_LABEL: Record<string, string> = {
  draft: '撰寫中',
  submitted_initial: '初驗已送件',
  feedback_required: '待處理回饋',
  ready_for_final: '總驗準備中',
  final_submitted: '總驗已送件',
  locked: '已鎖定',
};

export default function AdminPlansPage() {
  const round = useRound();
  const { context } = useTermContext();
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const families: FamilyRow[] = await fetchFamilies();
      // family-plans 是一次一家，六家就六個請求；一期只有 60–100 份，值不回票價的是快取
      const lists = await Promise.all(
        families.map((family) => fetchFamilyPlansFor(family.id, round))
      );
      setRows(
        families.flatMap((family, index) =>
          lists[index].map((plan) => ({ ...plan, family_name: family.name }))
        )
      );
    } catch (err) {
      setNotice({
        type: 'error',
        title: '無法取得教案',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setLoading(false);
    }
  }, [round]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleExcellent = async (row: PlanRow) => {
    setWorking(true);
    try {
      await setPlanExcellent(row.plan_id, !row.is_excellent);
      setRows((prev) =>
        prev.map((item) =>
          item.plan_id === row.plan_id ? { ...item, is_excellent: !item.is_excellent } : item
        )
      );
      setNotice({
        type: 'success',
        title: row.is_excellent ? '已取消優良標記' : '已標記為優良教案',
        message: row.tp_name,
      });
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

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-['Noto_Sans_TC'] text-[18px] font-bold text-black-900">教案管理</h2>
        <span className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
          {context?.current_term?.label} 全團共 {rows.length} 份
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : (
        <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <table className="w-full min-w-[820px] border-collapse text-[14px] font-['Noto_Sans_TC']">
            <thead>
              <tr className="bg-primary-100 font-bold text-black-900">
                <th className="h-[48px] px-4 text-left">教案</th>
                <th className="h-[48px] w-[80px] px-2 text-center">家別</th>
                <th className="h-[48px] w-[110px] px-2 text-center">撰寫者</th>
                <th className="h-[48px] w-[80px] px-2 text-center">類別</th>
                <th className="h-[48px] w-[130px] px-2 text-center">編輯狀態</th>
                <th className="h-[48px] w-[110px] px-2 text-center">優良教案</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black-200 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-[80px] text-center text-black-700">
                    本期還沒有教案。
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.plan_id} className="transition-colors hover:bg-primary-100">
                    <td className="h-[56px] px-4">
                      <span className="block truncate" title={row.tp_name}>
                        {row.tp_name}
                      </span>
                      <span className="text-[12px] text-black-500">
                        {row.grade}・{row.duration} 分鐘
                      </span>
                    </td>
                    <td className="h-[56px] px-2 text-center">{row.family_name}</td>
                    <td className="h-[56px] px-2 text-center">{row.writer_names.join('、') || '—'}</td>
                    <td className="h-[56px] px-2 text-center">{row.category}</td>
                    <td className="h-[56px] px-2 text-center">
                      <StatusChip
                        status={EDITING_STATUS_LABEL[row.editing_status] ?? row.editing_status}
                        tone={row.editing_status === 'draft' ? 'idle' : 'active'}
                      />
                    </td>
                    <td className="h-[56px] px-2 text-center">
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void toggleExcellent(row)}
                        className={`rounded-lg px-3 py-1 text-[13px] hover:cursor-pointer ${
                          row.is_excellent
                            ? 'bg-status-done-bg text-status-done'
                            : 'bg-black-100 text-black-500 hover:bg-primary-100'
                        }`}
                      >
                        {row.is_excellent ? '★ 優良' : '☆ 標記'}
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
