import type {
  TeachingPlanEditingStatus,
  TeachingPlanVisibilityStatus,
} from '@/services/teaching-plan';

const EDITING_STATUS_META: Record<
  TeachingPlanEditingStatus,
  { label: string; className: string }
> = {
  draft: { label: '撰寫中', className: 'bg-black-100 text-black-700' },
  submitted_initial: { label: '初驗已送件', className: 'bg-blue-50 text-blue-700' },
  feedback_required: { label: '待處理回饋', className: 'bg-amber-50 text-amber-700' },
  ready_for_final: { label: '總驗準備中', className: 'bg-violet-50 text-violet-700' },
  final_submitted: { label: '總驗已送件', className: 'bg-blue-50 text-blue-700' },
  locked: { label: '已鎖定', className: 'bg-emerald-50 text-emerald-700' },
};

const VISIBILITY_STATUS_META: Record<
  TeachingPlanVisibilityStatus,
  { label: string; className: string }
> = {
  private: { label: '未公開', className: 'border-black-300 text-black-600' },
  public: { label: '公開檢索', className: 'border-emerald-300 text-emerald-700' },
  archived: { label: '已封存', className: 'border-amber-300 text-amber-700' },
};

type PlanStatusBadgesProps = {
  editingStatus?: TeachingPlanEditingStatus;
  visibilityStatus?: TeachingPlanVisibilityStatus;
  compact?: boolean;
};

export function PlanStatusBadges({
  editingStatus,
  visibilityStatus,
  compact = false,
}: PlanStatusBadgesProps) {
  const editing = editingStatus ? EDITING_STATUS_META[editingStatus] : undefined;
  const visibility = visibilityStatus ? VISIBILITY_STATUS_META[visibilityStatus] : undefined;

  if (!editing && !visibility) {
    return <span className="text-black-500">—</span>;
  }

  return (
    <div
      className={[
        'flex items-center justify-center gap-1.5',
        compact ? 'flex-wrap justify-start' : 'flex-col',
      ].join(' ')}
      aria-label="教案狀態"
    >
      {editing && (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium leading-[150%] whitespace-nowrap ${editing.className}`}
        >
          {editing.label}
        </span>
      )}
      {visibility && (
        <span
          className={`inline-flex rounded-full border bg-white px-2 py-0.5 text-[12px] font-medium leading-[150%] whitespace-nowrap ${visibility.className}`}
        >
          {visibility.label}
        </span>
      )}
    </div>
  );
}
