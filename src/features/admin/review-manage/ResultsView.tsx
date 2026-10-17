'use client';

import React, { useMemo, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { BulkActionBar } from '@/features/review-shared/BulkActionBar';
import { ResultTable, decisionLabel } from '@/features/admin/results/ResultTable';
import { ResultConfirmModal, type ResultAction } from '@/features/admin/results/ResultConfirmModal';
import type { useResults } from '@/features/admin/results/useResults';
import type { Round } from '@/features/review-shared/types';
import { BTN, BTN_DANGER, BTN_PRIMARY, BTN_SM } from '@/lib/button-styles';

type Results = ReturnType<typeof useResults>;
type Notice = { type: 'success' | 'error'; title: string; message?: string };
type Filter = 'all' | 'pending' | 'passed' | 'remedial' | 'locked';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部結果' },
  { key: 'pending', label: '尚未判定' },
  { key: 'passed', label: '通過' },
  { key: 'remedial', label: '補驗' },
  { key: 'locked', label: '已鎖定 / 已發布' },
];

interface ResultsViewProps {
  round: Round;
  termLabel?: string;
  results: Results;
  canUnlock: boolean;
  onNotice: (notice: Notice) => void;
}

/**
 * 驗收結果（v13 `adminResults()`）：勾選 → 判定通過 / 補驗（鎖定）→ 發布本輪結果。
 * 結果只有「通過」與「補驗」；鎖定後要發布，作者才看得到。
 */
export const ResultsView: React.FC<ResultsViewProps> = ({ round, termLabel, results, canUnlock, onNotice }) => {
  const roundLabel = round === 'final' ? '總驗' : '初驗';
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ResultAction | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const picked = results.rows.filter((row) => selected.has(row.job_id));
  const lockedUnpublished = results.rows.filter(
    (row) => row.final_decision?.result_state === 'locked' && !row.result_published
  );

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return results.rows.filter((row) => {
      if (keyword && !row.tp_name.toLowerCase().includes(keyword)) return false;
      const decision = row.final_decision?.decision;
      const locked = row.final_decision?.result_state === 'locked';
      if (filter === 'pending') return !decision;
      if (filter === 'passed') return decision === 'passed';
      if (filter === 'remedial') return decision === 'remedial';
      if (filter === 'locked') return locked;
      return true;
    });
  }, [filter, query, results.rows]);

  const handleConfirm = async ({ reason, force }: { reason: string; force: boolean }) => {
    if (!confirmAction) return;
    try {
      if (confirmAction === 'publish') {
        await results.publish(lockedUnpublished, `${termLabel ?? ''} ${roundLabel}結果公告`);
        setConfirmAction(null);
        onNotice({
          type: 'success',
          title: '結果已發布',
          message: `${lockedUnpublished.length} 份教案的作者現在看得到結果與回饋。`,
        });
        return;
      }
      const failures = await results.applyDecision(picked, confirmAction, { reason, force });
      if (failures.length === 0) {
        setSelected(new Set());
        setConfirmAction(null);
        onNotice({ type: 'success', title: '結果已鎖定', message: `共 ${picked.length} 份。` });
      } else {
        // 失敗的留在選取狀態、modal 不關，才能勾「強制套用」直接重試
        setSelected(new Set(failures.map((item) => item.jobId)));
        onNotice({
          type: 'error',
          title: `${failures.length} 份未套用`,
          message: failures.map((item) => `${item.tpName}：${item.message}`).join('；'),
        });
      }
    } catch (err) {
      onNotice({ type: 'error', title: '操作失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
    }
  };

  const handleUnlock = async () => {
    if (!unlockTarget || !unlockReason.trim()) return;
    try {
      await results.unlock(unlockTarget, unlockReason.trim());
      setUnlockTarget(null);
      setUnlockReason('');
      onNotice({ type: 'success', title: '已解鎖', message: '這筆解鎖已寫入稽核紀錄。' });
    } catch (err) {
      onNotice({ type: 'error', title: '解鎖失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
    }
  };

  if (results.loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
      </div>
    );
  }
  if (results.error) {
    return <p className="font-['Noto_Sans_TC'] text-[14px] text-status-alert">{results.error}</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-[10px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋教案…"
          className="min-w-[220px] flex-1 rounded-[10px] border border-black-200 bg-white px-3 py-[9px] font-['Noto_Sans_TC'] text-[14px] outline-none focus:border-primary-700"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          className="rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px]"
        >
          {FILTERS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${BTN_PRIMARY} ml-auto`}
          onClick={() => setConfirmAction('publish')}
          disabled={lockedUnpublished.length === 0}
        >
          發布{roundLabel}結果{lockedUnpublished.length ? `（${lockedUnpublished.length}）` : ''}
        </button>
      </div>

      <BulkActionBar
        variant="inline"
        summary={
          <>
            <span className="font-bold text-black-900">已選 {picked.length} 份教案</span>
            <span className="ml-2 text-[12px]">
              判定後會鎖定；結果只有「通過」與「補驗」・已鎖定待發布 {lockedUnpublished.length} 份
            </span>
          </>
        }
      >
        <button
          type="button"
          className={`${BTN} ${BTN_SM}`}
          onClick={() => setSelected(new Set())}
          disabled={picked.length === 0}
        >
          取消選取
        </button>
        <button
          type="button"
          className={`${BTN} ${BTN_SM}`}
          onClick={() => setConfirmAction('passed')}
          disabled={picked.length === 0}
        >
          判定通過
        </button>
        <button
          type="button"
          className={`${BTN_DANGER} ${BTN_SM}`}
          onClick={() => setConfirmAction('remedial')}
          disabled={picked.length === 0}
        >
          判定補驗
        </button>
      </BulkActionBar>

      <ResultTable
        round={round}
        rows={visible}
        selected={selected}
        onToggle={(jobId, checked) =>
          setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(jobId);
            else next.delete(jobId);
            return next;
          })
        }
        onToggleAll={(checked) =>
          setSelected(
            checked
              ? new Set(visible.filter((row) => row.final_decision?.result_state !== 'locked').map((row) => row.job_id))
              : new Set()
          )
        }
        canUnlock={canUnlock}
        onUnlock={(row) => setUnlockTarget(row.job_id)}
      />
      <p className="mt-2 font-['Noto_Sans_TC'] text-[12px] text-black-500">
        點教案名稱可展開各驗收者的評分與回饋。最終結果目前：
        {['待處理', '通過', '補驗', '已鎖定', '已發布不可改']
          .map((label) => `${label} ${results.rows.filter((row) => decisionLabel(row) === label).length}`)
          .join('・')}
      </p>

      <ResultConfirmModal
        action={confirmAction}
        rows={confirmAction === 'publish' ? lockedUnpublished : picked}
        working={results.working}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />

      <Dialog
        open={!!unlockTarget}
        onClose={() => setUnlockTarget(null)}
        busy={results.working}
        size="sm"
        title="解鎖結果"
        subtitle="解鎖必須填理由，這筆會寫進稽核紀錄。"
        footer={
          <>
            <button type="button" className={BTN} onClick={() => setUnlockTarget(null)}>
              取消
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={handleUnlock}
              disabled={!unlockReason.trim() || results.working}
            >
              解鎖
            </button>
          </>
        }
      >
        <textarea
          value={unlockReason}
          onChange={(event) => setUnlockReason(event.target.value)}
          rows={3}
          placeholder="解鎖理由（必填）"
          className="w-full rounded-[10px] border border-black-200 px-3 py-2 font-['Noto_Sans_TC'] text-[14px]"
        />
      </Dialog>
    </>
  );
};
