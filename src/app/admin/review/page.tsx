'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/toast';
import { Tab } from '@/components/ui/Tab';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { BulkActionBar } from '@/features/review-shared/BulkActionBar';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { FamilyProgressTable } from '@/features/admin/overview/FamilyProgressTable';
import { AssignmentByPlan } from '@/features/admin/assignments/AssignmentByPlan';
import { AssignmentByReviewer } from '@/features/admin/assignments/AssignmentByReviewer';
import { useAssignmentBoard } from '@/features/admin/assignments/useAssignmentBoard';
import { ScheduleSettings } from '@/features/admin/settings/ScheduleSettings';
import { PolicySettings } from '@/features/admin/settings/PolicySettings';
import {
  fetchFamilySubmissions,
  fetchPolicy,
  fetchSchedules,
  patchPolicy,
  updateSchedules,
  type FamilySubmissionProgress,
  type ScheduleItemInput,
  type ScheduleRow,
} from '@/services/review';

type AdminTab = 'overview' | 'assignments' | 'results' | 'settings';

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'overview', label: '總覽' },
  { key: 'assignments', label: '驗收分配' },
  { key: 'results', label: '驗收結果' },
  { key: 'settings', label: '時程與規則' },
];

export default function AdminReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const round = useRound();
  const { context, reload: reloadContext } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const tabParam = searchParams?.get('tab');
  const tab: AdminTab = (TABS.find((item) => item.key === tabParam)?.key ?? 'overview') as AdminTab;

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const setQuery = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      Object.entries(patch).forEach(([key, value]) => params.set(key, value));
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  /* ---------- 總覽 ---------- */
  const [progress, setProgress] = useState<FamilySubmissionProgress[]>([]);
  useEffect(() => {
    if (tab !== 'overview') return;
    void fetchFamilySubmissions(round).then(setProgress).catch(() => setProgress([]));
  }, [round, tab]);

  /* ---------- 時程與規則 ---------- */
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [policy, setPolicy] = useState<Record<string, boolean> | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (tab !== 'settings' || !termId) return;
    void fetchSchedules(termId).then(setSchedules).catch(() => setSchedules([]));
    void fetchPolicy(termId).then(setPolicy).catch(() => setPolicy(null));
  }, [tab, termId]);

  const handleSaveSchedules = async (items: ScheduleItemInput[]) => {
    if (!termId) return;
    setSettingsSaving(true);
    try {
      setSchedules(await updateSchedules(termId, items));
      await reloadContext();
      setNotice({ type: 'success', title: '已更新時程', message: '前台立即生效。' });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '更新失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleTogglePolicy = async (key: string, value: boolean) => {
    if (!termId) return;
    setSettingsSaving(true);
    try {
      setPolicy(await patchPolicy(termId, { [key]: value }));
      await reloadContext();
    } catch (err) {
      setNotice({
        type: 'error',
        title: '更新失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  /* ---------- 驗收分配 ---------- */
  const board = useAssignmentBoard(round);
  const [editing, setEditing] = useState(false);
  const [byReviewer, setByReviewer] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkReviewer, setBulkReviewer] = useState('');
  const [bulkSlot, setBulkSlot] = useState<'A' | 'B'>('A');

  const published = context?.stage_state?.[round]?.assignment_published ?? false;

  const applyBulk = () => {
    if (!bulkReviewer) return;
    selected.forEach((jobId) => board.setSlot(jobId, bulkSlot, bulkReviewer));
    setSelected(new Set());
  };

  const handleSaveAssignments = async () => {
    try {
      await board.save();
      setEditing(false);
      setNotice({
        type: 'success',
        title: '分配已儲存',
        message: '這是草稿，reviewer 還看不到；要發布之後才會出現在他們的任務清單。',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '儲存失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  const handlePublish = async () => {
    try {
      await board.publish({ title: `${context?.current_term?.label ?? ''} ${round === 'initial' ? '初驗' : '總驗'}任務發布` });
      await reloadContext();
      setNotice({ type: 'success', title: '任務已發布', message: 'reviewer 現在看得到自己的任務了。' });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '發布失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  const conflictNames = useMemo(
    () => [...new Set(board.conflicts.map((item) => `${item.reviewerName}（${item.family}）`))],
    [board.conflicts]
  );

  return (
    <div>
      <Tab tabs={TABS} active={tab} onChange={(next) => setQuery({ tab: next })} />

      <div className="mt-4">
        <RoundTabs />
      </div>

      {tab === 'overview' && (
        <div className="mt-6">
          <FamilyProgressTable rows={progress} />
        </div>
      )}

      {tab === 'assignments' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setByReviewer(false)}
                className={`rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${!byReviewer ? 'bg-primary-900 text-white' : 'bg-white text-black-700 hover:bg-primary-100'}`}
              >
                依教案
              </button>
              <button
                type="button"
                onClick={() => setByReviewer(true)}
                className={`rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${byReviewer ? 'bg-primary-900 text-white' : 'bg-white text-black-700 hover:bg-primary-100'}`}
              >
                依驗收者
              </button>
            </div>

            {!byReviewer && (
              <Button
                onClick={() => setEditing((prev) => !prev)}
                className={`ml-auto px-4 py-1 ${editing ? 'border border-primary-900 bg-white text-primary-900' : 'bg-primary-900 text-white'}`}
              >
                {editing ? '結束編輯' : '編輯分配'}
              </Button>
            )}
          </div>

          {published && (
            <div className="mt-4">
              <LockBanner
                title="本輪任務已發布"
                description="reviewer 已經看得到自己的任務。之後換人會保留原本的分配紀錄，但對方會立刻看到變動。"
                tone="active"
              />
            </div>
          )}

          {conflictNames.length > 0 && (
            <div className="mt-4">
              <LockBanner
                title="有人被分到自家教案"
                description={`${conflictNames.join('、')}。儲存不會被擋，但對方提交時後端會拒絕。`}
                tone="alert"
              />
            </div>
          )}

          {board.loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
            </div>
          ) : board.error ? (
            <p className="mt-6 font-['Noto_Sans_TC'] text-[15px] text-status-alert">{board.error}</p>
          ) : byReviewer ? (
            <AssignmentByReviewer rows={board.load} />
          ) : (
            <AssignmentByPlan
              jobs={board.jobs}
              slots={board.slots}
              reviewers={board.reviewers}
              editing={editing}
              selected={selected}
              onToggleSelect={(jobId, checked) =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (checked) next.add(jobId);
                  else next.delete(jobId);
                  return next;
                })
              }
              onToggleSelectAll={(checked) =>
                setSelected(checked ? new Set(board.jobs.map((job) => job.id)) : new Set())
              }
              onSetSlot={board.setSlot}
            />
          )}

          {!byReviewer && editing && (
            <BulkActionBar
              summary={
                <>
                  已選 <span className="font-bold text-primary-900">{selected.size}</span> 份
                  ｜未填滿 <span className="font-bold">{board.incomplete.length}</span> 份
                  ｜未儲存 <span className="font-bold">{board.changes.length}</span> 格
                </>
              }
            >
              <select
                value={bulkSlot}
                onChange={(event) => setBulkSlot(event.target.value as 'A' | 'B')}
                className="rounded-lg border border-black-200 px-2 py-1 text-[14px]"
              >
                <option value="A">Slot A</option>
                <option value="B">Slot B</option>
              </select>
              <select
                value={bulkReviewer}
                onChange={(event) => setBulkReviewer(event.target.value)}
                className="max-w-[180px] rounded-lg border border-black-200 px-2 py-1 text-[14px]"
              >
                <option value="">選擇 reviewer</option>
                {board.reviewers.map((reviewer) => (
                  <option key={reviewer.user_id} value={reviewer.user_id}>
                    {reviewer.name || reviewer.email}
                  </option>
                ))}
              </select>
              <Button
                onClick={applyBulk}
                disabled={!bulkReviewer || selected.size === 0}
                className="border border-primary-900 bg-white px-4 py-1 text-primary-900"
              >
                批量指派
              </Button>
              <Button
                onClick={handleSaveAssignments}
                disabled={board.saving || board.changes.length === 0}
                className="bg-primary-900 px-4 py-1 font-bold text-white"
              >
                {board.saving ? '儲存中…' : '儲存草稿'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={board.saving || board.incomplete.length > 0 || board.changes.length > 0}
                className="bg-secondary-700 px-4 py-1 font-bold text-white"
              >
                發布任務
              </Button>
            </BulkActionBar>
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="mt-6 rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-black-900">驗收結果尚未開放</p>
          <p className="mt-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
            初驗結果彙整與確認鎖定是下一張 ticket（F5-4）。
          </p>
        </div>
      )}

      {tab === 'settings' && (
        <div className="mt-6">
          <ScheduleSettings schedules={schedules} saving={settingsSaving} onSave={handleSaveSchedules} />
          <PolicySettings policy={policy} saving={settingsSaving} onToggle={handleTogglePolicy} />
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
