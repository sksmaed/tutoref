'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { MetricCard } from '@/components/ui/Card';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { TermPageHead } from '@/features/review-shared/TermPageHead';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { formatDateTime } from '@/features/review-shared/format';
import { ROLE_LABEL } from '@/components/layout/user-display';
import { TaskList, isPending } from '@/features/review-tasks/TaskList';
import { useReviewTasks } from '@/features/review-tasks/useReviewTasks';
import { AuthorPlanTable } from '@/features/review-author/AuthorPlanTable';
import { AuthorRoundPlanModal } from '@/features/review-author/AuthorRoundPlanModal';
import { FinalRevisionUploadModal } from '@/features/review-author/FinalRevisionUploadModal';
import { useAuthorReview } from '@/features/review-author/useAuthorReview';
import type { AuthorJobRow } from '@/services/review';

type Notice = { type: 'success' | 'error'; title: string; message?: string };

function Spinner() {
  return (
    <div className="flex min-h-[20vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[10px] border border-black-200 bg-white px-6 py-10 text-center">
      <p className="font-['Noto_Sans_TC'] text-[15px] text-status-alert">{message}</p>
    </div>
  );
}

function SectionHead({ title, description, chip }: { title: string; description: string; chip: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-['Noto_Sans_TC'] text-[17px] font-bold text-black-900">{title}</h2>
        <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-black-500">{description}</p>
      </div>
      {chip}
    </div>
  );
}

/**
 * 我的驗收任務（v13 `renderReviewTasks()`）：依身分顯示「我的教案」（撰寫者）與「待驗收教案」（驗收者）。
 * 原本的「本期教案」頁併進來，/review/my-plans 會導到這裡。
 */
export default function ReviewTasksPage() {
  const router = useRouter();
  const round = useRound();
  const roundLabel = round === 'final' ? '總驗' : '初驗';
  const { context, loading: contextLoading, can } = useTermContext();
  const isAuthor = can('plan.author');
  const isReviewer = can('review.submit');

  const tasks = useReviewTasks(round, isReviewer);
  const author = useAuthorReview(round, isAuthor);

  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<AuthorJobRow | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!contextLoading && !isAuthor && !isReviewer) router.replace('/review');
  }, [contextLoading, isAuthor, isReviewer, router]);

  if (!isAuthor && !isReviewer) return null;

  const stage = context?.stage_state?.[round];
  const assignmentOpen = !!stage?.assignment_published;
  const reviewDueAt = stage?.review_due_at ?? null;
  const openJob = author.jobs.find((job) => job.id === openJobId) ?? null;
  const roles = Array.from(new Set((context?.roles ?? []).map((role) => ROLE_LABEL[role.role] ?? role.role)));
  const done = tasks.jobs.filter((job) => !isPending(job)).length;

  // 成功不跳 toast：那一則自己會顯示新狀態與「已儲存」，十則回饋不該彈十次
  const handleRespond = async (itemId: string, status: Parameters<typeof author.respond>[1], body: string) => {
    try {
      await author.respond(itemId, status, body);
    } catch (err) {
      setNotice({ type: 'error', title: '更新失敗', message: err instanceof Error ? err.message : '請稍後再試。' });
    }
  };

  const handleUpload = async (file: File) => {
    if (!uploadTarget) return;
    try {
      const result = await author.uploadSheet(uploadTarget.plan_id, file);
      setUploadTarget(null);
      setNotice({ type: 'success', title: '已收到修改版', message: result.message ?? '檔案更新作業已排入背景處理。' });
    } catch (err) {
      // 後端只回錯誤碼，這裡翻成使用者看得懂的話
      const code = (err as { code?: string })?.code;
      const message =
        code === 'teaching_plan:not_author'
          ? '只有這份教案的撰寫者可以上傳修改版。'
          : code === 'teaching_plan:not_found'
            ? '找不到這份教案，請重新整理後再試。'
            : err instanceof Error
              ? err.message
              : '請稍後再試。';
      setNotice({ type: 'error', title: '上傳失敗', message });
    }
  };

  return (
    <div className="mb-16">
      <TermPageHead title="我的驗收任務" description="依目前擁有的角色顯示撰寫與驗收工作。" />
      <RoundTabs />
      {roles.length > 0 && (
        <p className="-mt-1 mb-5 font-['Noto_Sans_TC'] text-[12px] text-black-500">目前角色：{roles.join('＋')}</p>
      )}

      {isAuthor && (
        <section>
          <SectionHead
            title="我的教案"
            description={
              author.progress.total > 0
                ? `要交給別人驗收的教案・共 ${author.progress.total} 則回饋，已處理 ${author.progress.done} 則`
                : '要交給別人驗收的教案'
            }
            chip={<StatusChip status="撰寫者" tone="active" />}
          />
          {/* 只有還沒有資料時才用 spinner 佔位；有資料就留著，免得 modal 被卸載 */}
          {author.loading && author.jobs.length === 0 ? (
            <Spinner />
          ) : author.error ? (
            <ErrorBox message={author.error} />
          ) : (
            <AuthorPlanTable jobs={author.jobs} jobProgress={author.jobProgress} onOpen={(job) => setOpenJobId(job.id)} />
          )}
        </section>
      )}

      {isReviewer && (
        <section className={isAuthor ? 'mt-[34px]' : ''}>
          <SectionHead
            title="待驗收教案"
            description="分配給我驗收的教案"
            chip={<StatusChip status="驗收者" tone="info" />}
          />
          {!assignmentOpen ? (
            <LockBanner
              title={`${roundLabel}驗收任務尚未開放`}
              description="請等待教案組完成驗收分配並發布訊息公告。"
            />
          ) : tasks.loading ? (
            <Spinner />
          ) : tasks.error ? (
            <ErrorBox message={tasks.error} />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                  label="待驗收"
                  value={tasks.jobs.length - done}
                  hint={reviewDueAt ? `截止 ${formatDateTime(reviewDueAt)}` : undefined}
                />
                <MetricCard label="已完成" value={done} hint={`本輪共 ${tasks.jobs.length} 份`} />
                <MetricCard
                  label="目前輪次"
                  value={<span className="text-[22px]">{`${context?.current_term?.label ?? ''}・${roundLabel}`}</span>}
                  hint="任務已發布"
                />
              </div>
              <TaskList
                jobs={tasks.jobs}
                reviewDueAt={reviewDueAt}
                canEditAfterSubmit={!!context?.policy?.reviewer_can_edit_after_submit}
              />
            </>
          )}
        </section>
      )}

      <AuthorRoundPlanModal
        job={openJob}
        round={round}
        termLabel={context?.current_term?.label}
        feedback={openJob ? (author.feedback[openJob.id] ?? []) : []}
        progress={openJob ? author.jobProgress(openJob) : { total: 0, done: 0 }}
        working={author.working}
        onClose={() => setOpenJobId(null)}
        onRespond={handleRespond}
        onUploadRevision={setUploadTarget}
      />

      <FinalRevisionUploadModal
        open={!!uploadTarget}
        planName={uploadTarget?.tp_name ?? ''}
        working={author.working}
        onClose={() => setUploadTarget(null)}
        onUpload={handleUpload}
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
