'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { TaskList } from '@/features/review-tasks/TaskList';
import { useReviewTasks } from '@/features/review-tasks/useReviewTasks';

export default function ReviewTasksPage() {
  const router = useRouter();
  const round = useRound();
  const { context, loading: contextLoading } = useTermContext();
  const { jobs, loading, error } = useReviewTasks(round);

  const canReview = !!context?.capabilities?.includes('review.submit');

  useEffect(() => {
    if (!contextLoading && !canReview) router.replace('/review');
  }, [canReview, contextLoading, router]);

  if (!canReview) return null;

  return (
    <div className="mb-16">
      <div className="mt-4">
        <RoundTabs />
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-status-alert">{error}</p>
        </div>
      ) : (
        <TaskList jobs={jobs} reviewDueAt={context?.stage_state?.[round]?.review_due_at ?? null} />
      )}
    </div>
  );
}
