'use client';

import { useCallback, useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { Tab } from '@/components/ui/Tab';
import { Dialog } from '@/components/ui/Dialog';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { PageHead } from '@/components/layout/PageHead';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';
import { useAssignmentBoard } from '@/features/admin/assignments/useAssignmentBoard';
import { useResults } from '@/features/admin/results/useResults';
import { ScheduleSettings } from '@/features/admin/settings/ScheduleSettings';
import { PolicySettings } from '@/features/admin/settings/PolicySettings';
import { RubricPanel } from '@/features/admin/rubric/RubricPanel';
import { ScheduleTab } from '@/features/admin/review-manage/ScheduleTab';
import { SubmissionsView } from '@/features/admin/review-manage/SubmissionsView';
import { AssignmentsView } from '@/features/admin/review-manage/AssignmentsView';
import { ResultsView } from '@/features/admin/review-manage/ResultsView';
import { useScheduleSettings } from '@/features/admin/review-manage/useScheduleSettings';
import {
  useAdminReviewQuery,
  type AdminTab,
  type RoundView,
} from '@/features/admin/review-manage/useAdminReviewQuery';
import { BTN } from '@/lib/button-styles';
import { fetchFamilySubmissions, type FamilySubmissionProgress, type ScheduleItemInput } from '@/services/review';

type Notice = { type: 'success' | 'error'; title: string; message?: string };

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'schedule', label: '驗收時程' },
  { key: 'rubric', label: '驗收標準' },
  { key: 'initial', label: '初驗' },
  { key: 'final', label: '總驗' },
];

const VIEW_TABS: { key: RoundView; label: string }[] = [
  { key: 'submissions', label: '教案清單' },
  { key: 'assignments', label: '分配' },
  { key: 'results', label: '驗收結果' },
];

/** 某一輪（初驗 / 總驗）的三個子頁籤；拆成元件讓 hook 以輪次為單位重新載入。 */
function RoundPanel({ round, view, onViewChange, onNotice }: {
  round: Round;
  view: RoundView;
  onViewChange: (view: RoundView) => void;
  onNotice: (notice: Notice) => void;
}) {
  const { context } = useTermContext();
  const board = useAssignmentBoard(round);
  const results = useResults(round);
  const [progress, setProgress] = useState<FamilySubmissionProgress[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchFamilySubmissions(round)
      .then((rows) => !cancelled && setProgress(rows))
      .catch(() => !cancelled && setProgress([]));
    return () => {
      cancelled = true;
    };
  }, [round]);

  // 「已完成」看後端給的 submitted（該 slot 已提交或提交後修改過）
  const isSlotDone = useCallback(
    (jobId: string, slot: string) =>
      !!board.jobs
        .find((job) => job.id === jobId)
        ?.assignments.find((assignment) => assignment.slot_label === slot)?.submitted,
    [board.jobs]
  );

  const roundLabel = round === 'final' ? '總驗' : '初驗';

  return (
    <>
      <p className="mb-4 rounded-xl border border-dashed border-primary-300 bg-primary-100/50 px-[13px] py-[11px] font-['Noto_Sans_TC'] text-[12px] text-black-700">
        <b>{roundLabel}</b>・教案清單、驗收分配與結果均保留在本輪頁籤內。
      </p>
      <SegmentedTabs tabs={VIEW_TABS} active={view} onChange={onViewChange} className="mb-4" />

      {view === 'submissions' && <SubmissionsView round={round} progress={progress} />}
      {view === 'assignments' && (
        <AssignmentsView
          round={round}
          board={board}
          published={!!context?.stage_state?.[round]?.assignment_published}
          progress={progress}
          finalReusesInitial={!!context?.policy?.final_reuses_initial_reviewers}
          isSlotDone={isSlotDone}
          onNotice={onNotice}
        />
      )}
      {view === 'results' && (
        <ResultsView
          round={round}
          termLabel={context?.current_term?.label}
          results={results}
          canUnlock={!!context?.policy?.leader_can_unlock_result}
          onNotice={onNotice}
        />
      )}
    </>
  );
}

/** 本期驗收管理（v13 `renderAdminReview()`）。 */
export default function AdminReviewPage() {
  const { context } = useTermContext();
  const { tab, view, round, setTab, setView } = useAdminReviewQuery();
  const settings = useScheduleSettings();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSaveSchedules = async (items: ScheduleItemInput[]) => {
    try {
      await settings.saveSchedules(items);
      setNotice({ type: 'success', title: '已更新時程', message: '前台立即生效。' });
    } catch (err) {
      setNotice({ type: 'error', title: '更新失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
    }
  };

  const handleTogglePolicy = async (key: string, value: boolean) => {
    try {
      await settings.togglePolicy(key, value);
    } catch (err) {
      setNotice({ type: 'error', title: '更新失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
    }
  };

  return (
    <div>
      <PageHead
        title="本期驗收管理"
        subtitle={`${context?.current_term?.label ? `${context.current_term.label}・` : ''}管理驗收時程、標準，以及初驗與總驗的教案、分配和結果。`}
        actions={
          <button type="button" className={BTN} onClick={() => setScheduleOpen(true)}>
            ⚙ 編輯時程
          </button>
        }
      />
      <Tab tabs={TABS} active={tab} onChange={setTab} variant="compact" />

      {tab === 'schedule' && (
        <ScheduleTab
          termLabel={context?.current_term?.label}
          schedules={settings.schedules}
          policy={settings.policy}
          onEdit={() => setScheduleOpen(true)}
        />
      )}
      {tab === 'rubric' && <RubricPanel />}
      {round && <RoundPanel key={round} round={round} view={view} onViewChange={setView} onNotice={setNotice} />}

      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        busy={settings.saving}
        size="lg"
        title={`${context?.current_term?.label ?? ''}驗收時程與規則`}
        subtitle="改動後前台立即生效"
      >
        <ScheduleSettings schedules={settings.schedules} saving={settings.saving} onSave={handleSaveSchedules} />
        <PolicySettings policy={settings.policy} saving={settings.saving} onToggle={handleTogglePolicy} />
      </Dialog>

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
