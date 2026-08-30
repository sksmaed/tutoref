'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { AuthorPlanList } from '@/features/review-author/AuthorPlanList';
import { FinalRevisionUploadModal } from '@/features/review-author/FinalRevisionUploadModal';
import { useAuthorReview } from '@/features/review-author/useAuthorReview';
import type { AuthorJobRow } from '@/services/review';

export default function MyPlansPage() {
  const router = useRouter();
  const round = useRound();
  const { context, loading: contextLoading } = useTermContext();
  const { jobs, feedback, loading, error, working, progress, respond, uploadSheet } =
    useAuthorReview(round);

  const [uploadTarget, setUploadTarget] = useState<AuthorJobRow | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const canAuthor = !!context?.capabilities?.includes('plan.author');

  useEffect(() => {
    if (!contextLoading && !canAuthor) router.replace('/review');
  }, [canAuthor, contextLoading, router]);

  const handleRespond = async (itemId: string, status: Parameters<typeof respond>[1], body: string) => {
    try {
      await respond(itemId, status, body);
      setNotice({ type: 'success', title: '已更新處理狀態' });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '更新失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  const handleUpload = async (file: File) => {
    if (!uploadTarget) return;
    try {
      const result = await uploadSheet(uploadTarget.plan_id, file);
      setUploadTarget(null);
      setNotice({
        type: 'success',
        title: '已收到修改版',
        message: result.message ?? '檔案更新作業已排入背景處理。',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '上傳失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  if (!canAuthor) return null;

  return (
    <div className="mb-16">
      <div className="mt-4">
        <RoundTabs />
      </div>

      {progress.total > 0 && (
        <p className="mt-4 font-['Noto_Sans_TC'] text-[15px] text-black-900">
          共 <span className="font-bold">{progress.total}</span> 則回饋，已處理{' '}
          <span className="font-bold text-primary-900">{progress.done}</span> 則
        </p>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-status-alert">{error}</p>
        </div>
      ) : (
        <AuthorPlanList
          jobs={jobs}
          feedback={feedback}
          working={working}
          onRespond={handleRespond}
          onUploadRevision={setUploadTarget}
        />
      )}

      <FinalRevisionUploadModal
        open={!!uploadTarget}
        planName={uploadTarget?.tp_name ?? ''}
        working={working}
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
