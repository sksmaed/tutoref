'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { ReviewFormState } from './useReviewWorkspace';
import type { RubricCheckItem, RubricSnapshot, ReviewSubmissionOut } from '@/services/review';

const BAND_LABEL: Record<string, string> = {
  potential_excellent: '潛力優良',
  pass: '通過',
  discussion: '待討論',
  fail: '未通過',
};

interface InitialReviewFormProps {
  rubric: RubricSnapshot;
  form: ReviewFormState;
  onChange: (patch: Partial<ReviewFormState>) => void;
  onBlur: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
  /** 已提交後是否還能改，由 policy.reviewer_can_edit_after_submit 決定。 */
  editable: boolean;
  showLiveScore: boolean;
  liveScore: { score: number; band: string; deducted: number } | null;
  submission: ReviewSubmissionOut | null;
  draftSavedAt: Date | null;
}

export const InitialReviewForm: React.FC<InitialReviewFormProps> = ({
  rubric,
  form,
  onChange,
  onBlur,
  onSubmit,
  submitting,
  submitted,
  editable,
  showLiveScore,
  liveScore,
  submission,
  draftSavedAt,
}) => {
  const grouped = useMemo(() => {
    const groups = new Map<string, RubricCheckItem[]>();
    for (const item of rubric.check_items ?? []) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return [...groups.entries()];
  }, [rubric]);

  const locked = submitted && !editable;

  const toggle = (itemId: string, checked: boolean) => {
    const next = new Set(form.checked);
    if (checked) next.add(itemId);
    else next.delete(itemId);
    onChange({ checked: next });
  };

  return (
    <div className="flex flex-col gap-4">
      {(showLiveScore || submitted) && (
        <div className="rounded-lg border border-black-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
              {submitted ? '系統計算分數' : '試算分數'}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-['Noto_Sans_TC'] text-[28px] font-bold text-primary-900">
                {submitted ? submission?.score : (liveScore?.score ?? '—')}
              </span>
              <StatusChip
                status={
                  submitted
                    ? (BAND_LABEL[submission?.band ?? ''] ?? '—')
                    : (liveScore?.band ?? '—')
                }
              />
            </span>
          </div>
          {!submitted && (
            <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-black-500">
              以送出後系統計算為準。底分 {rubric.scoring?.base_score}，已扣 {liveScore?.deducted ?? 0} 分。
            </p>
          )}
        </div>
      )}

      {grouped.map(([category, items]) => (
        <section key={category} className="rounded-lg bg-white px-4 py-3 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">{category}</h3>
          <div className="mt-2 flex flex-col gap-2">
            {items.map((item) => {
              const checked = form.checked.has(item.id);
              return (
                <div key={item.id} className="border-b border-black-100 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className={locked ? 'pointer-events-none opacity-70' : ''}>
                      <Checkbox
                        checked={checked}
                        onChange={(next) => !locked && toggle(item.id, next)}
                        label={item.label}
                        className="items-start"
                      />
                    </span>
                    <span className="shrink-0 font-['Noto_Sans_TC'] text-[13px] text-status-alert">
                      −{item.deduction_value}
                    </span>
                  </div>
                  {item.description && (
                    <p className="ml-7 font-['Noto_Sans_TC'] text-[12px] text-black-500">{item.description}</p>
                  )}
                  {checked && (
                    <input
                      type="text"
                      value={form.reasons[item.id] ?? ''}
                      placeholder="補充說明（會給作者看到）"
                      disabled={locked}
                      onChange={(event) =>
                        onChange({ reasons: { ...form.reasons, [item.id]: event.target.value } })
                      }
                      onBlur={onBlur}
                      className="mt-1 ml-7 w-[calc(100%-1.75rem)] rounded-lg border border-black-200 px-3 py-1 font-['Noto_Sans_TC'] text-[14px]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-lg bg-white px-4 py-3 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <label className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">整體評語</label>
        <textarea
          value={form.overallComment}
          disabled={locked}
          onChange={(event) => onChange({ overallComment: event.target.value })}
          onBlur={onBlur}
          rows={3}
          placeholder="會給作者看到"
          className="mt-2 w-full rounded-lg border border-black-200 px-3 py-2 font-['Noto_Sans_TC'] text-[14px]"
        />

        <label className="mt-4 block font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
          內部備註
        </label>
        <p className="font-['Noto_Sans_TC'] text-[12px] text-black-500">只有教案組看得到，不會出現在作者端。</p>
        <textarea
          value={form.privateNote}
          disabled={locked}
          onChange={(event) => onChange({ privateNote: event.target.value })}
          onBlur={onBlur}
          rows={2}
          className="mt-2 w-full rounded-lg border border-black-200 px-3 py-2 font-['Noto_Sans_TC'] text-[14px]"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-['Noto_Sans_TC'] text-[13px] text-black-500">
          {locked
            ? '本期不開放提交後修改。'
            : draftSavedAt
              ? `草稿已存 ${draftSavedAt.toLocaleTimeString('zh-TW', { hour12: false })}`
              : '草稿每 30 秒自動儲存'}
        </span>
        {!locked && (
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-primary-900 px-6 py-2 font-bold text-white"
          >
            {submitting ? '送出中…' : submitted ? '更新提交' : '送出驗收'}
          </Button>
        )}
      </div>
    </div>
  );
};
