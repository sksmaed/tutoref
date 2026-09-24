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
import { ResultTable } from '@/features/admin/results/ResultTable';
import { ResultConfirmModal, type ResultAction } from '@/features/admin/results/ResultConfirmModal';
import { useResults } from '@/features/admin/results/useResults';
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

  const published = context?.stage_state?.[round]?.assignment_published ?? false;

  const handleSaveAssignments = async () => {
    try {
      await board.save();
      setEditing(false);
      setNotice({
        type: 'success',
        title: '分配已儲存',
        // 可見性看的是「這一輪有沒有發布過」，所以已發布的輪次存完就立刻生效
        message: published
          ? '本輪已發布，被指派的人現在就看得到這些變動。'
          : '這是草稿，reviewer 還看不到；要按「發布任務」才會出現在他們的任務清單。',
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

  /* ---------- 驗收結果 ---------- */
  const results = useResults(round);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ResultAction | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  const pickedResults = results.rows.filter((row) => selectedResults.has(row.job_id));
  const lockedUnpublished = results.rows.filter(
    (row) => row.final_decision?.result_state === 'locked' && !row.result_published
  );
  const canUnlock = !!context?.policy?.leader_can_unlock_result;

  const handleResultConfirm = async ({ reason, force }: { reason: string; force: boolean }) => {
    if (!confirmAction) return;
    try {
      if (confirmAction === 'publish') {
        await results.publish(
          lockedUnpublished,
          `${context?.current_term?.label ?? ''} ${round === 'initial' ? '初驗' : '總驗'}結果公告`
        );
        setNotice({
          type: 'success',
          title: '結果已發布',
          message: `${lockedUnpublished.length} 份教案的作者現在看得到結果與回饋。`,
        });
      } else {
        const failures = await results.applyDecision(pickedResults, confirmAction, { reason, force });
        if (failures.length === 0) {
          setSelectedResults(new Set());
          setConfirmAction(null);
          setNotice({ type: 'success', title: '結果已鎖定', message: `共 ${pickedResults.length} 份。` });
        } else {
          // 失敗的留在選取狀態、modal 不關，才能勾「強制套用」直接重試
          setSelectedResults(new Set(failures.map((item) => item.jobId)));
          setNotice({
            type: 'error',
            title: `${failures.length} 份未套用`,
            message: failures.map((item) => `${item.tpName}：${item.message}`).join('；'),
          });
        }
        return;
      }
      setConfirmAction(null);
    } catch (err) {
      setNotice({
        type: 'error',
        title: '操作失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  const handleUnlock = async () => {
    if (!unlockTarget || !unlockReason.trim()) return;
    try {
      await results.unlock(unlockTarget, unlockReason.trim());
      setUnlockTarget(null);
      setUnlockReason('');
      setNotice({ type: 'success', title: '已解鎖', message: '這筆解鎖已寫入稽核紀錄。' });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '解鎖失敗',
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

          </div>

          {published && (
            <div className="mt-4">
              <LockBanner
                title="本輪任務已發布"
                description="發布是整輪一次的動作，不會再發第二次。之後新增或換人的分配只要按「儲存草稿」，對方就立刻看得到；換掉的人會保留原本的分配紀錄。"
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
              onSetSlot={board.setSlot}
              onAddSlot={board.addSlot}
              onRemoveSlot={board.removeSlot}
            />
          )}

          {/* 操作列不分模式一律顯示: 只在編輯時才出現的話, 還沒分配過的輪次看起來像唯讀頁 */}
          {!byReviewer && !board.loading && (
            <BulkActionBar
              summary={
                <>
                  已分配 <span className="font-bold">{board.assignmentCount}</span> 人次
                  {editing && (
                    <>
                      ｜未儲存{' '}
                      <span className="font-bold text-primary-900">{board.changes.length}</span> 格
                    </>
                  )}
                  {published && (
                    <span className="ml-2 text-[13px] text-black-500">
                      本輪已發布，儲存後對方立刻看得到
                    </span>
                  )}
                </>
              }
            >
              {editing ? (
                <>
                  <Button
                    onClick={() => setEditing(false)}
                    className="border border-primary-900 bg-white px-4 py-1 text-primary-900"
                  >
                    結束編輯
                  </Button>
                  <Button
                    onClick={handleSaveAssignments}
                    disabled={board.saving || board.changes.length === 0}
                    className="bg-primary-900 px-4 py-1 font-bold text-white"
                  >
                    {board.saving ? '儲存中…' : '儲存草稿'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditing(true)}
                  disabled={board.jobs.length === 0}
                  className="bg-primary-900 px-4 py-1 font-bold text-white"
                >
                  編輯分配
                </Button>
              )}
              {/* 發布是整輪一次的動作 (term + stage)，發過就不會再有第二次;
                  之後新增的分配只要儲存，reviewer 立刻看得到 */}
              {!published && (
                <Button
                  onClick={handlePublish}
                  disabled={
                    board.saving ||
                    board.jobs.length === 0 ||
                    board.changes.length > 0
                  }
                  className="bg-secondary-700 px-4 py-1 font-bold text-white"
                >
                  發布任務
                </Button>
              )}
            </BulkActionBar>
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="mt-6">
          {results.loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
            </div>
          ) : results.error ? (
            <p className="font-['Noto_Sans_TC'] text-[15px] text-status-alert">{results.error}</p>
          ) : (
            <>
              <ResultTable
                round={round}
                rows={results.rows}
                selected={selectedResults}
                onToggle={(jobId, checked) =>
                  setSelectedResults((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(jobId);
                    else next.delete(jobId);
                    return next;
                  })
                }
                onToggleAll={(checked) =>
                  setSelectedResults(
                    checked
                      ? new Set(
                          results.rows
                            .filter((row) => row.final_decision?.result_state !== 'locked')
                            .map((row) => row.job_id)
                        )
                      : new Set()
                  )
                }
                canUnlock={canUnlock}
                onUnlock={(row) => setUnlockTarget(row.job_id)}
              />

              <BulkActionBar
                summary={
                  <>
                    已選 <span className="font-bold text-primary-900">{pickedResults.length}</span> 份
                    ｜已鎖定待發布 <span className="font-bold">{lockedUnpublished.length}</span> 份
                  </>
                }
              >
                <Button
                  onClick={() => setConfirmAction('passed')}
                  disabled={pickedResults.length === 0}
                  className="border border-primary-900 bg-white px-4 py-1 text-primary-900"
                >
                  判定通過
                </Button>
                <Button
                  onClick={() => setConfirmAction('remedial')}
                  disabled={pickedResults.length === 0}
                  className="border border-status-alert bg-white px-4 py-1 text-status-alert"
                >
                  判定補驗
                </Button>
                <Button
                  onClick={() => setConfirmAction('publish')}
                  disabled={lockedUnpublished.length === 0}
                  className="bg-secondary-700 px-4 py-1 font-bold text-white"
                >
                  發布結果
                </Button>
              </BulkActionBar>
            </>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="mt-6">
          <ScheduleSettings schedules={schedules} saving={settingsSaving} onSave={handleSaveSchedules} />
          <PolicySettings policy={policy} saving={settingsSaving} onToggle={handleTogglePolicy} />
        </div>
      )}

      <ResultConfirmModal
        action={confirmAction}
        rows={confirmAction === 'publish' ? lockedUnpublished : pickedResults}
        working={results.working}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleResultConfirm}
      />

      {unlockTarget && (
        <div className="fixed inset-0 z-1000">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: '#0D0D0DB2' }}
            onClick={() => setUnlockTarget(null)}
            aria-hidden
          />
          <div className="absolute left-1/2 top-1/2 w-[min(460px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-white px-8 py-6 shadow-xl">
            <h3 className="text-center font-['Noto_Sans_TC'] text-[18px] font-medium text-black-900">
              解鎖結果
            </h3>
            <p className="mt-2 font-['Noto_Sans_TC'] text-[13px] text-black-700">
              解鎖必須填理由，這筆會寫進稽核紀錄。
            </p>
            <textarea
              value={unlockReason}
              onChange={(event) => setUnlockReason(event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-lg border border-black-200 px-3 py-2 text-[14px]"
            />
            <div className="mt-4 flex justify-center gap-[10px]">
              <Button
                onClick={() => setUnlockTarget(null)}
                className="w-[110px] rounded-lg border border-primary-900 bg-white py-2 text-primary-900"
              >
                取消
              </Button>
              <Button
                onClick={handleUnlock}
                disabled={!unlockReason.trim() || results.working}
                className="w-[110px] rounded-lg bg-primary-900 py-2 font-bold text-white"
              >
                解鎖
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
