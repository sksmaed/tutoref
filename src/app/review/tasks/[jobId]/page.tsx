'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Toast } from '@/components/ui/toast';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { ReviewWorkspace } from '@/features/review-tasks/ReviewWorkspace';
import { InitialReviewForm } from '@/features/review-tasks/InitialReviewForm';
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
    submitting,
    submitted,
    draftSavedAt,
    liveScore,
  } = useReviewWorkspace(jobId);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

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
      <div className="mt-6 mb-16 rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <p className="font-['Noto_Sans_TC'] text-[16px] text-status-alert">{error ?? '找不到這個驗收任務'}</p>
        <Link href="/review/tasks" className="mt-4 inline-block text-[15px] text-primary-900 hover:opacity-80">
          ← 回到我的驗收任務
        </Link>
      </div>
    );
  }

  const metadata = workspace.snapshot.metadata as Record<string, string | number>;
  const editable = context?.policy?.reviewer_can_edit_after_submit ?? false;

  return (
    <div className="mb-16">
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href="/review/tasks" className="text-[14px] text-primary-900 hover:opacity-80">
            ← 我的驗收任務
          </Link>
          <h2 className="mt-1 font-['Noto_Sans_TC'] text-[20px] font-bold text-black-900">
            {String(metadata.tp_name ?? '')}
          </h2>
          <p className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
            {String(metadata.team ?? '')}・{String(metadata.category ?? '')}・
            {String(metadata.grade ?? '')}・{String(metadata.duration ?? '')} 分鐘
            {workspace.my_slot && `・Slot ${workspace.my_slot}`}
          </p>
        </div>
      </div>

      {submitted && (
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
        {workspace.rubric ? (
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
