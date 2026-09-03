'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BulkActionBar } from '@/features/review-shared/BulkActionBar';
import { deadlineState, formatDateTime } from '@/features/review-shared/format';
import { FamilyReviewTable } from '@/features/review-family/FamilyReviewTable';
import { MissingSubmissionPanel } from '@/features/review-family/MissingSubmissionPanel';
import { SubmitConfirmModal } from '@/features/review-family/SubmitConfirmModal';
import { useFamilyReview } from '@/features/review-family/useFamilyReview';
import { Button } from '@/components/ui/Button';
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
  const missingCount = missing.reduce((total, item) => total + (item.missing_count || 0), 0);

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
      <div className="mt-4">
        <RoundTabs />
      </div>

      {due.label && (
        <p
          className={`mt-4 font-['Noto_Sans_TC'] text-[15px] ${due.overdue ? 'text-status-alert' : 'text-black-700'}`}
        >
          送件截止 {formatDateTime(dueAt)}・{due.label}
          {due.overdue && '（逾期仍可送出）'}
        </p>
      )}

      {locked && (
        <div className="mt-4">
          <LockBanner
            title="本輪已送出，清單與附件已鎖定"
            description={`送出時間 ${formatDateTime(data?.progress?.submitted_at)}，共 ${data?.progress?.snapshot_count ?? 0} 份進入驗收。本期沒有補件流程，如需調整請聯絡教案組。`}
          />
        </div>
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
            onToggleAll={(checked) =>
              setSelected(checked ? new Set(plans.map((plan) => plan.plan_id)) : new Set())
            }
          />

          <MissingSubmissionPanel
            items={missing}
            onChange={setMissing}
            disabled={locked}
            readonlyTotal={data?.progress?.missing_total ?? 0}
          />

          {!locked && (
            <BulkActionBar
              summary={
                <>
                  已選 <span className="font-bold text-primary-900">{included.length}</span> 份
                  ｜缺交 <span className="font-bold">{missingCount}</span> 份
                </>
              }
            >
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={plans.length === 0}
                className="bg-primary-900 px-6 py-2 font-bold text-white"
              >
                送出本輪驗收
              </Button>
            </BulkActionBar>
          )}
        </>
      )}

      <SubmitConfirmModal
        open={confirmOpen}
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
