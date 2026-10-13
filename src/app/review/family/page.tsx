'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { TermPageHead } from '@/features/review-shared/TermPageHead';
import { BTN_PRIMARY } from '@/lib/button-styles';
import { deadlineState, formatDateTime } from '@/features/review-shared/format';
import { FamilyReviewTable } from '@/features/review-family/FamilyReviewTable';
import { MissingSubmissionPanel } from '@/features/review-family/MissingSubmissionPanel';
import { SubmitConfirmModal } from '@/features/review-family/SubmitConfirmModal';
import { useFamilyReview } from '@/features/review-family/useFamilyReview';
import type { MissingItem } from '@/services/review';

export default function FamilyReviewPage() {
  const router = useRouter();
  const round = useRound();
  const { context, loading: contextLoading } = useTermContext();
  const { data, loading, error, submitting, submit } = useFamilyReview(round);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [missing, setMissing] = useState<MissingItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 站上沒有全域 Toaster，既有頁面都是自己 render <Toast>，這裡照做
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(null);

  const canSubmit = !!context?.capabilities?.includes('family.submit');
  const locked = !!data?.progress?.submitted;
  const plans = useMemo(() => data?.plans ?? [], [data]);

  useEffect(() => {
    if (!contextLoading && !canSubmit) router.replace('/review');
  }, [canSubmit, contextLoading, router]);

  // 尚未送出時預設全選；送出後清單改由後端的 included 決定
  useEffect(() => {
    if (locked) return;
    setSelected(new Set(plans.map((plan) => plan.plan_id)));
  }, [locked, plans]);

  const included = plans.filter((plan) => selected.has(plan.plan_id));
  const excluded = plans.filter((plan) => !selected.has(plan.plan_id));
  const roundLabel = round === 'final' ? '總驗' : '初驗';

  const dueAt = context?.stage_state?.[round]?.submission_due_at ?? null;
  const due = deadlineState(dueAt);

  const handleSubmit = async () => {
    try {
      await submit(
        included.map((plan) => plan.plan_id),
        missing
      );
      setConfirmOpen(false);
      setNotice({
        type: 'success',
        title: '已送出本輪驗收',
        message: `共 ${included.length} 份教案進入驗收。`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '送出失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    }
  };

  if (!canSubmit) return null;

  return (
    <div className="mb-16">
      <TermPageHead
        title="家內教案"
        description={
          locked
            ? `${roundLabel}清單已送出教案組，本輪內容已鎖定，只能檢視。`
            : `逐份確認${roundLabel}是否納入本輪驗收；送出時會連同缺交註記一起提供給教案組。`
        }
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => setConfirmOpen(true)}
            disabled={locked || loading || plans.length === 0}
          >
            {locked ? '已送出驗收' : '送出驗收'}
          </button>
        }
      />
      <RoundTabs />

      {due.label && (
        <p
          className={`mb-4 font-['Noto_Sans_TC'] text-[14px] ${due.overdue ? 'text-status-alert' : 'text-black-700'}`}
        >
          送件截止 {formatDateTime(dueAt)}・{due.label}
          {due.overdue && '（逾期仍可送出）'}
        </p>
      )}

      {locked && (
        <LockBanner
          className="mb-4"
          title={`${context?.current_term?.label ?? ''}・${roundLabel}家內清單已送出`}
          description={`送出時間 ${formatDateTime(data?.progress?.submitted_at)}，共 ${data?.progress?.snapshot_count ?? 0} 份進入驗收。「納入本輪驗收」、教案附件與缺交註記皆不可再修改；本期沒有補件流程，如需調整請聯絡教案組。`}
        />
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : error ? (
        <div className="rounded-[10px] border border-black-200 bg-white px-6 py-10 text-center">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-status-alert">{error}</p>
        </div>
      ) : (
        <>
          <FamilyReviewTable
            plans={plans}
            locked={locked}
            selected={selected}
            onToggle={(planId, checked) =>
              setSelected((prev) => {
                const next = new Set(prev);
                if (checked) next.add(planId);
                else next.delete(planId);
                return next;
              })
            }
          />

          <MissingSubmissionPanel
            items={missing}
            onChange={setMissing}
            disabled={locked}
            readonlyTotal={data?.progress?.missing_total ?? 0}
          />

          <p className="mt-3 font-['Noto_Sans_TC'] text-[12px] text-black-500">
            初驗送出後永久凍結；總驗會在另一個分頁重新確認一次，資料保留至下學期開始前。
          </p>
        </>
      )}

      <SubmitConfirmModal
        open={confirmOpen}
        roundLabel={roundLabel}
        included={included}
        excluded={excluded}
        missing={missing}
        submitting={submitting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
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
