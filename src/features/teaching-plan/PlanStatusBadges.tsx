import type {
  TeachingPlanEditingStatus,
  TeachingPlanVisibilityStatus,
} from '@/services/teaching-plan';

const EDITING_STATUS_META: Record<
  TeachingPlanEditingStatus,
  { label: string; className: string }
> = {
  draft: { label: '撰寫中', className: 'bg-status-idle-bg text-black-700' },
  submitted_initial: { label: '初驗已送件', className: 'bg-status-info-bg text-status-info' },
  feedback_required: { label: '待處理回饋', className: 'bg-status-active-bg text-status-active' },
  ready_for_final: { label: '總驗準備中', className: 'bg-status-active-bg text-status-active' },
  final_submitted: { label: '總驗已送件', className: 'bg-status-info-bg text-status-info' },
  locked: { label: '已鎖定', className: 'bg-status-done-bg text-status-done' },
};

const VISIBILITY_STATUS_META: Record<
  TeachingPlanVisibilityStatus,
  { label: string; className: string }
> = {
  private: { label: '未公開', className: 'border-black-300 text-black-500' },
  public: { label: '公開檢索', className: 'border-secondary-700 text-status-done' },
  archived: { label: '已封存', className: 'border-primary-300 text-status-active' },
};

type PlanStatusBadgesProps = {
  editingStatus?: TeachingPlanEditingStatus;
  visibilityStatus?: TeachingPlanVisibilityStatus;
  compact?: boolean;
  /** 靠左排列（v13 表格欄位）。 */
  align?: 'center' | 'start';
};

export function PlanStatusBadges({
  editingStatus,
  visibilityStatus,
  compact = false,
  align = 'center',
}: PlanStatusBadgesProps) {
  const editing = editingStatus ? EDITING_STATUS_META[editingStatus] : undefined;
  const visibility = visibilityStatus ? VISIBILITY_STATUS_META[visibilityStatus] : undefined;

  if (!editing && !visibility) {
    return <span className="text-black-500">—</span>;
  }

  return (
    <div
      className={[
        'flex gap-1.5',
        compact ? 'flex-wrap items-center justify-start' : 'flex-col',
        !compact && (align === 'start' ? 'items-start' : 'items-center justify-center'),
      ].filter(Boolean).join(' ')}
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
