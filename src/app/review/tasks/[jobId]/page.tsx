'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Toast } from '@/components/ui/toast';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { formatDateTime } from '@/features/review-shared/format';
import { ReviewWorkspace } from '@/features/review-tasks/ReviewWorkspace';
import { InitialReviewForm } from '@/features/review-tasks/InitialReviewForm';
import { FinalReviewForm } from '@/features/review-tasks/FinalReviewForm';
import { useReviewWorkspace } from '@/features/review-tasks/useReviewWorkspace';

export default function ReviewWorkspacePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { context } = useTermContext();
  const {
    workspace,
    loading,
    error,
    form,
    update,
    saveDraft,
    submit,
    submitFinal,
    submitting,
    submitted,
    draftSavedAt,
    liveScore,
  } = useReviewWorkspace(jobId);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const handleFinalSubmit = async (payload: Parameters<typeof submitFinal>[0]) => {
    try {
      await submitFinal(payload);
      setNotice({ type: 'success', title: '已送出總驗判定' });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '送出失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      await submit();
      setNotice({ type: 'success', title: '已送出驗收', message: '分數由系統依勾選項目計算。' });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '送出失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="mb-16 rounded-[10px] border border-black-200 bg-white px-6 py-10 text-center">
        <p className="font-['Noto_Sans_TC'] text-[16px] text-status-alert">{error ?? '找不到這個驗收任務'}</p>
        <Link href="/review/tasks" className="mt-4 inline-block text-[15px] text-primary-900 hover:opacity-80">
          ← 回到我的驗收任務
        </Link>
      </div>
    );
  }

  const metadata = workspace.snapshot.metadata as Record<string, string | number>;
  const editable = context?.policy?.reviewer_can_edit_after_submit ?? false;
  // 總驗記在 ReviewRecord，初驗記在 ReviewSubmission，兩邊都要算「已提交」
  const alreadySubmitted = submitted || !!workspace.my_record;
  const roundKey = workspace.job.job_type === 'final_review' ? 'final' : 'initial';
  const dueAt = context?.stage_state?.[roundKey]?.review_due_at;
  const dueText = dueAt ? `截止 ${formatDateTime(dueAt)}` : '';

  return (
    <div className="mb-16">
      <div className="flex flex-wrap items-baseline justify-between gap-2 md:pr-16">
        <div>
          <Link href={`/review/tasks?round=${roundKey}`} className="font-['Noto_Sans_TC'] text-[13px] font-bold text-primary-900 hover:opacity-80">
            ← 我的驗收任務
          </Link>
          <p className="mt-2 font-['Noto_Sans_TC'] text-[12px] text-black-500">
            {[context?.current_term?.label, roundKey === 'final' ? '總驗' : '初驗', dueText].filter(Boolean).join('・')}
          </p>
          <h1 className="font-['Noto_Sans_TC'] text-[21px] font-bold leading-[150%] text-black-900">
            {String(metadata.tp_name ?? '')}
          </h1>
          <p className="font-['Noto_Sans_TC'] text-[13px] text-black-500">
            {String(metadata.team ?? '')}・{String(metadata.category ?? '')}・
            {String(metadata.grade ?? '')}・{String(metadata.duration ?? '')} 分鐘
            {workspace.my_slot && `・Slot ${workspace.my_slot}`}
          </p>
        </div>
      </div>

      {alreadySubmitted && (
        <div className="mt-4">
          <LockBanner
            title="你已提交這份驗收"
            description={
              editable
                ? '本期開放提交後修改；再次送出會留下修改紀錄。'
                : '本期不開放提交後修改，如需更動請聯絡教案組。'
            }
            tone={editable ? 'active' : 'locked'}
          />
        </div>
      )}

      <ReviewWorkspace workspace={workspace}>
        {workspace.job.job_type === 'final_review' ? (
          <FinalReviewForm
            rubric={workspace.rubric}
            initialFeedback={workspace.initial_feedback ?? []}
            record={workspace.my_record}
            submitting={submitting}
            onSubmit={handleFinalSubmit}
          />
        ) : workspace.rubric ? (
          <InitialReviewForm
            rubric={workspace.rubric}
            form={form}
            onChange={update}
            onBlur={() => void saveDraft()}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitted={submitted}
            editable={editable}
            showLiveScore={workspace.show_live_score}
            liveScore={liveScore}
            submission={workspace.my_submission}
            draftSavedAt={draftSavedAt}
          />
        ) : (
          <p className="font-['Noto_Sans_TC'] text-[15px] text-black-700">這個任務還沒有鎖定的驗收標準。</p>
        )}
      </ReviewWorkspace>

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
