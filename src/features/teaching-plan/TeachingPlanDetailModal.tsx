'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TeachingPlanDetail } from '@/services/teaching-plan';

type PlanSummary = {
  id: string;
  title: string;
  team: string;
  issue: string;
  category: string;
  author: string;
  grade?: string | null;
  duration?: number | null;
  isExcellent?: boolean;
};

interface TeachingPlanDetailModalProps {
  open: boolean;
  loading?: boolean;
  plan?: TeachingPlanDetail | null;
  summary?: PlanSummary | null;
  liked?: boolean;
  favoriteLoading?: boolean;
  onClose: () => void;
  onToggleFavorite?: (planId: string, nextLiked: boolean) => Promise<void> | void;
}

const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 bg-[#0d0d0db2] backdrop-blur-[1px]';
const panelClass = [
  'relative flex w-full sm:w-[960px] flex-col rounded-[16px] sm:rounded-[8px] bg-white',
  'h-[90dvh] sm:h-[680px]',
  'px-5 sm:px-[60px] pt-6 sm:pt-[32px] pb-8 sm:pb-[44px] text-black-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)]',
].join(' ');

type ExpandableKey = 'objectives' | 'outline' | 'notes';

export function TeachingPlanDetailModal({
  open,
  loading = false,
  plan,
  summary,
  liked = false,
  favoriteLoading = false,
  onClose,
  onToggleFavorite,
}: TeachingPlanDetailModalProps) {
  const [expandedFields, setExpandedFields] = useState<Record<ExpandableKey, boolean>>({
    objectives: false,
    outline: false,
    notes: false,
  });

  useEffect(() => {
    if (!open) {
      setExpandedFields({ objectives: false, outline: false, notes: false });
    }
  }, [open]);

  useEffect(() => {
    setExpandedFields({ objectives: false, outline: false, notes: false });
  }, [plan?.id, summary?.id]);

  const display = useMemo(() => {
    if (!plan && !summary) return null;

    return {
      id: plan?.id ?? summary?.id ?? '',
      title: plan?.tp_name ?? summary?.title ?? '—',
      team: plan?.team ?? summary?.team ?? '—',
      issue: plan ? `${plan.academic_year ?? ''}${plan.semester_period ?? ''}` : summary?.issue ?? '—',
      category: plan?.category ?? summary?.category ?? '—',
      author: plan?.writer_name ?? summary?.author ?? '—',
      grade: plan?.grade ?? summary?.grade ?? '—',
      duration:
        plan?.duration ?? summary?.duration ?? null,
      isExcellent: plan?.is_excellent ?? summary?.isExcellent ?? false,
      objectives: plan?.objectives ?? '',
      outline: plan?.outline ?? '',
      notes: plan?.post_class_notes ?? '',
      sheetPdf: plan?.sheet_pdf ?? null,
      slidePdf: plan?.slide_pdf ?? null,
    };
  }, [plan, summary]);

  const handleToggleField = (key: ExpandableKey) => {
    setExpandedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!open) return null;

  const showLoading = loading && !display;
  const durationText = display && display.duration != null && Number.isFinite(display.duration)
    ? `${display.duration} 分鐘`
    : '—';

  return (
    <div className={overlayClass}>
      <div className={panelClass} role="dialog" aria-modal="true" aria-label="教案詳細資訊">
        <button
          type="button"
          onClick={() => {
            if (favoriteLoading) return;
            onClose();
          }}
          aria-label="關閉"
          className="absolute right-[24px] top-[24px] z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black-100 hover:cursor-pointer"
        >
          <img src="/icons/close.svg" alt="close" width={18} height={18} />
        </button>

        <div className="flex h-full flex-col gap-5 sm:gap-[44px]">
          <header className="relative flex flex-col items-center gap-3 sm:gap-0">
            <h2 className="text-center font-['Noto_Sans_TC'] text-[20px] sm:text-[25px] font-bold leading-[150%] text-black-900">
              課程詳細資訊
            </h2>

            {/* 手機版：標題下方的操作列 */}
            <div className="flex w-full items-center justify-between sm:hidden">
              {display?.isExcellent ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-[14px] font-semibold text-secondary-700">
                  <img src="/icons/good.svg" alt="優良教案" width={20} height={20} />
                  優良教案
                </span>
              ) : <span />}
              <FavoriteButton
                liked={liked}
                disabled={favoriteLoading || !display?.id || !onToggleFavorite}
                onClick={async () => {
                  if (!onToggleFavorite || !display?.id) return;
                  await onToggleFavorite(display.id, !liked);
                }}
              />
            </div>

            {/* 桌機版：收藏按鈕絕對定位 */}
            <div className="absolute right-2 top-10 hidden sm:block">
              <FavoriteButton
                liked={liked}
                disabled={favoriteLoading || !display?.id || !onToggleFavorite}
                onClick={async () => {
                  if (!onToggleFavorite || !display?.id) return;
                  await onToggleFavorite(display.id, !liked);
                }}
              />
            </div>
          </header>

          <section className="flex-1 overflow-hidden">
            {showLoading ? (
              <div className="flex h-full items-center justify-center text-[16px] text-black-500">
                資料載入中...
              </div>
            ) : display ? (
              <div className="h-full max-w-[840px] overflow-y-auto pr-2">
                <div className="overflow-hidden rounded-[8px] border border-black-200">
                  <DetailRow label="課程名稱">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[16px] font-semibold leading-[150%] text-black-900">{display.title}</p>
                      {display.isExcellent ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-[14px] font-semibold text-secondary-700">
                          <img src="/icons/good.svg" alt="優良教案" width={20} height={20} />
                          優良教案
                        </span>
                      ) : null}
                    </div>
                  </DetailRow>

                  <DetailRowGroup
                    items={[
                      { label: '家別', content: display.team || '—' },
                      { label: '期數', content: display.issue || '—' },
                      { label: '撰寫者', content: display.author || '—' },
                    ]}
                  />

                  <DetailRowGroup
                    items={[
                      { label: '類別', content: display.category || '—' },
                      { label: '適用年級', content: display.grade || '—' },
                      { label: '課程時長', content: durationText },
                    ]}
                  />

                  <DetailRow label="課程目標">
                    <ExpandableField
                      value={display.objectives}
                      expanded={expandedFields.objectives}
                      onToggle={() => handleToggleField('objectives')}
                    />
                  </DetailRow>

                  <DetailRow label="課程大綱">
                    <ExpandableField
                      value={display.outline}
                      expanded={expandedFields.outline}
                      onToggle={() => handleToggleField('outline')}
                    />
                  </DetailRow>

                  <DetailRow label="完課筆記">
                    <ExpandableField
                      value={display.notes}
                      expanded={expandedFields.notes}
                      onToggle={() => handleToggleField('notes')}
                    />
                  </DetailRow>

                  <DetailRowGroup
                    items={[
                      { label: '教案紙', content: <ResourceLink href={display.sheetPdf} /> },
                      { label: '投影片', content: <ResourceLink href={display.slidePdf} /> },
                    ]}
                    isLast
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[16px] text-black-500">
                目前無法載入教案內容。
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={['grid grid-cols-[120px_1fr] bg-white', !isLast ? 'border-b border-black-200' : ''].join(' ')}>
      <div className="flex min-h-[48px] items-center justify-center border-r border-black-200 bg-primary-100 px-[16px] py-[8px] text-[16px] font-semibold leading-[150%] text-black-900">
        {label}
      </div>
      <div className="px-[24px] py-[12px] text-[16px] leading-[150%] text-black-900 whitespace-pre-line">
        {children}
      </div>
    </div>
  );
}

function DetailRowGroup({
  items,
  isLast,
}: {
  items: Array<{ label: string; content: React.ReactNode }>;
  isLast?: boolean;
}) {
  return (
    <div className={['bg-white flex flex-col sm:flex-row', !isLast ? 'border-b border-black-200' : ''].join(' ')}>
      {items.map((item, index) => {
        const isLastItem = index === items.length - 1;
        return (
          <div
            key={item.label}
            className={[
              'flex-1 grid grid-cols-[120px_1fr]',
              !isLastItem ? 'border-b border-black-200 sm:border-b-0 sm:border-r' : '',
            ].join(' ')}
          >
            <div className="flex min-h-[48px] items-center justify-center border-r border-black-200 bg-primary-100 px-[16px] py-[8px] text-[16px] font-semibold leading-[150%] text-black-900">
              {item.label}
            </div>
            <div className="px-[24px] py-[12px] text-[16px] leading-[150%] text-black-900 whitespace-pre-line">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpandableField({
  value,
  expanded,
  onToggle,
}: {
  value?: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const content = value?.trim();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const collapsedHeight = 51;

  useEffect(() => {
    const el = textRef.current;
    if (!el) {
      setIsOverflowing(false);
      return;
    }

    const measure = () => {
      const scrollHeight = el.scrollHeight;
      setIsOverflowing(scrollHeight > collapsedHeight + 1);
    };

    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [content]);

  if (!content) return <span>—</span>;

  return (
    <div className="relative flex flex-col gap-2 text-[15px] text-black-700">
      <div
        className={expanded ? 'relative' : 'relative overflow-hidden'}
        style={expanded ? undefined : { maxHeight: `${collapsedHeight}px` }}
      >
        <p ref={textRef} className="break-words whitespace-pre-line">
          {content}
        </p>
        {!expanded && isOverflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {isOverflowing && (
        <button
          type="button"
          onClick={onToggle}
          className="self-start text-[14px] font-semibold text-primary-900 underline"
        >
          {expanded ? '顯示更少' : '顯示更多'}
        </button>
      )}
    </div>
  );
}



function ResourceLink({ href }: { href?: string | null }) {
  if (!href || !href.trim()) {
    return <span>—</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-900 underline decoration-2 underline-offset-4"
    >
      pdf
    </a>
  );
}

function FavoriteButton({
  liked,
  disabled,
  onClick,
}: {
  liked: boolean;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex h-[32px] w-auto items-center justify-center gap-[4px] whitespace-nowrap px-[12px]',
        'rounded-[8px] border border-primary-900 px-[12px] py-[5px] text-[14px] ',
        liked ? 'bg-primary-100 text-primary-900' : 'bg-white text-primary-900',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-primary-100/60 hover:cursor-pointer',
      ].join(' ')}
    >
      <img
        src={liked ? '/icons/liked.svg' : '/icons/like.svg'}
        alt="收藏"
        width={16}
        height={16}
        style={{
          filter: 'brightness(0) saturate(100%) invert(48%) sepia(86%) saturate(682%) hue-rotate(360deg) brightness(101%) contrast(95%)',
        }}
      />
      <span>{liked ? '已收藏' : '收藏教案'}</span>
    </button>
  );
}

export default TeachingPlanDetailModal;
