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
  const { jobs, feedback, loading, error, working, progress, jobProgress, respond, uploadSheet } =
    useAuthorReview(round);

  const [uploadTarget, setUploadTarget] = useState<AuthorJobRow | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const canAuthor = !!context?.capabilities?.includes('plan.author');

  useEffect(() => {
    if (!contextLoading && !canAuthor) router.replace('/review');
  }, [canAuthor, contextLoading, router]);

  // 成功不跳 toast: 那一列自己會顯示新狀態與「已儲存」, 十則回饋不該彈十次
  const handleRespond = async (itemId: string, status: Parameters<typeof respond>[1], body: string) => {
    try {
      await respond(itemId, status, body);
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
      // 後端只回錯誤碼, 這裡翻成使用者看得懂的話
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

      {/* 只有還沒有資料時才用 spinner 佔位; 有資料就留著, 免得列表被卸載、展開狀態歸零 */}
      {loading && jobs.length === 0 ? (
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
          jobProgress={jobProgress}
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
