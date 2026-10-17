'use client';

import React, { useMemo } from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
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

  const scoreValue = submitted ? submission?.score : (liveScore?.score ?? '—');
  const bandValue = submitted ? (BAND_LABEL[submission?.band ?? ''] ?? '—') : (liveScore?.band ?? '—');

  return (
    <div className="flex flex-col gap-3">
      <LockBanner
        tone="active"
        title="驗收定位：把關教案品質的底線"
        description="勾選「未達標」的項目，系統依固定權重自動計算加權分數；沒有缺失的項目不需勾選。"
      />

      {(showLiveScore || submitted) && (
        <div className="sticky top-2 z-[3] rounded-[13px] border border-primary-300 bg-primary-100 px-[14px] py-3 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-['Noto_Sans_TC'] text-[12px] text-black-500">
                {submitted ? '系統計算加權分數' : '試算加權分數'}
              </p>
              <p className="font-['Noto_Sans_TC'] text-[30px] font-extrabold leading-none text-primary-900">
                {scoreValue}
              </p>
            </div>
            <StatusChip status={bandValue} />
          </div>
          {!submitted && (
            <p className="mt-2 font-['Noto_Sans_TC'] text-[12px] leading-[155%] text-black-500">
              {rubric.scoring?.base_score} −（各類未達標項目 × 對應扣分）= {liveScore?.score ?? '—'}・已扣{' '}
              {liveScore?.deducted ?? 0} 分，以送出後系統計算為準。
            </p>
          )}
        </div>
      )}

      {grouped.map(([category, items], groupIndex) => {
        const deductions = new Set(items.map((item) => item.deduction_value));
        const uniform = deductions.size === 1 ? items[0]?.deduction_value : null;
        return (
          <section key={category} className="overflow-hidden rounded-xl border border-black-200 bg-white">
            <div className="flex items-start justify-between gap-3 bg-black-100/60 px-[14px] py-3">
              <div>
                <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
                  {groupIndex + 1}. {category}
                </h3>
                <p className="font-['Noto_Sans_TC'] text-[12px] text-black-500">請勾選未達標項目；若無缺失不需勾選。</p>
              </div>
              {uniform && <StatusChip status={`每項 −${uniform} 分`} tone="active" />}
            </div>
            <div className="px-[14px] pb-[14px] pt-2">
              {items.map((item) => {
                const checked = form.checked.has(item.id);
                return (
                  <div key={item.id} className="border-b border-black-100 py-[9px] last:border-b-0">
                    <label className={`grid grid-cols-[20px_1fr_auto] items-start gap-[9px] ${locked ? 'cursor-default' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        className="mt-[3px] h-4 w-4 accent-[var(--color-status-alert)]"
                        checked={checked}
                        disabled={locked}
                        onChange={(event) => toggle(item.id, event.target.checked)}
                      />
                      <span className="font-['Noto_Sans_TC'] text-[13px] leading-[155%] text-black-900">
                        {item.label}
                        {item.description && (
                          <span className="block text-[12px] text-black-500">{item.description}</span>
                        )}
                      </span>
                      {!uniform && (
                        <span className="font-['Noto_Sans_TC'] text-[12px] text-status-alert">−{item.deduction_value}</span>
                      )}
                    </label>
                    {checked && (
                      <input
                        type="text"
                        value={form.reasons[item.id] ?? ''}
                        placeholder="具體、可修改的說明（會給作者看到）"
                        disabled={locked}
                        onChange={(event) => onChange({ reasons: { ...form.reasons, [item.id]: event.target.value } })}
                        onBlur={onBlur}
                        className="mt-2 ml-[29px] w-[calc(100%-29px)] rounded-[10px] border border-black-200 px-3 py-[6px] font-['Noto_Sans_TC'] text-[13px]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="overflow-hidden rounded-xl border border-black-200 bg-white">
        <div className="flex items-center justify-between gap-3 bg-black-100/60 px-[14px] py-3">
          <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">其他參考回饋</h3>
          <span className="font-['Noto_Sans_TC'] text-[12px] text-black-500">非必填、不影響分數</span>
        </div>
        <div className="px-[14px] pb-[14px] pt-3">
          <label className="block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700">整體評語（會給作者看到）</label>
          <textarea
            value={form.overallComment}
            disabled={locked}
            onChange={(event) => onChange({ overallComment: event.target.value })}
            onBlur={onBlur}
            rows={3}
            placeholder="驗收標準沒有涵蓋的細節、其他想法或鼓勵…"
            className="mt-[6px] w-full rounded-[10px] border border-black-200 px-3 py-2 font-['Noto_Sans_TC'] text-[14px]"
          />
          <label className="mt-3 block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700">
            內部備註（只有教案組看得到）
          </label>
          <textarea
            value={form.privateNote}
            disabled={locked}
            onChange={(event) => onChange({ privateNote: event.target.value })}
            onBlur={onBlur}
            rows={2}
            className="mt-[6px] w-full rounded-[10px] border border-black-200 px-3 py-2 font-['Noto_Sans_TC'] text-[14px]"
          />
        </div>
      </section>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-black-200 bg-black-100 px-1 py-3">
        <span className="font-['Noto_Sans_TC'] text-[12px] text-black-500">
          {locked
            ? '本期不開放提交後修改。'
            : draftSavedAt
              ? `草稿已存 ${draftSavedAt.toLocaleTimeString('zh-TW', { hour12: false })}`
              : '草稿每 30 秒自動儲存'}
        </span>
        {!locked && (
          <span className="flex gap-2">
            <button type="button" className={BTN} onClick={onBlur} disabled={submitting}>
              儲存草稿
            </button>
            <button type="button" className={BTN_PRIMARY} onClick={onSubmit} disabled={submitting}>
              {submitting ? '送出中…' : submitted ? '更新提交' : '提交初驗'}
            </button>
          </span>
        )}
      </div>
    </div>
  );
};
