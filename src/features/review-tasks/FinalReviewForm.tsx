'use client';

import React, { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BTN_PRIMARY } from '@/lib/button-styles';

const SECTION = 'overflow-hidden rounded-xl border border-black-200 bg-white';
const SECTION_HEAD = 'flex flex-wrap items-start justify-between gap-3 bg-black-100/60 px-[14px] py-3';
const SECTION_TITLE = "font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900";
const PART_TITLE = "mt-2 font-['Noto_Sans_TC'] text-[15px] font-extrabold text-black-900";
import type {
  FinalCheckItem,
  InitialFeedbackRecap,
  OwnFinalRecord,
  RubricSnapshot,
} from '@/services/review';

type Verdict = 'passed' | 'failed';

const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  todo: '待處理',
  changed: '已修改',
  partially_changed: '部分修改',
  not_changed: '不修改',
};

interface FinalReviewFormProps {
  rubric: RubricSnapshot | null;
  initialFeedback: InitialFeedbackRecap[];
  /** 已送出的判定；有值代表這一 slot 送過了。 */
  record: OwnFinalRecord | null;
  submitting: boolean;
  onSubmit: (payload: {
    sheet_result: Verdict;
    slide_result: Verdict;
    sheet_failed_reason: string;
    slide_failed_reason: string;
  }) => void;
}

const VerdictPicker: React.FC<{
  value: Verdict;
  onChange: (next: Verdict) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    {(['passed', 'failed'] as Verdict[]).map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => onChange(option)}
        className={`cursor-pointer rounded-lg border px-3 py-[6px] font-['Noto_Sans_TC'] text-[14px] font-bold ${
          value === option
            ? option === 'passed'
              ? 'border-status-done bg-status-done text-white'
              : 'border-status-alert bg-status-alert text-white'
            : 'border-black-200 bg-white text-black-700 hover:bg-primary-100'
        }`}
      >
        {option === 'passed' ? '通過' : '未通過'}
      </button>
    ))}
  </div>
);

/**
 * 總驗表單：初驗改善追蹤 / 教案紙判定 / 投影片檢核（§6.3）。
 *
 * 後端記錄的只有教案紙與投影片各自 passed / failed 與未通過理由，
 * 沒有逐項的儲存欄位，所以檢核清單是對照用的，畫面上寫明白。
 */
export const FinalReviewForm: React.FC<FinalReviewFormProps> = ({
  rubric,
  initialFeedback,
  record,
  submitting,
  onSubmit,
}) => {
  const [sheetResult, setSheetResult] = useState<Verdict>((record?.sheet_result as Verdict) ?? 'passed');
  const [slideResult, setSlideResult] = useState<Verdict>((record?.slide_result as Verdict) ?? 'passed');
  const [sheetReason, setSheetReason] = useState(record?.sheet_failed_reason ?? '');
  const [slideReason, setSlideReason] = useState(record?.slide_failed_reason ?? '');
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  const sections = useMemo(() => {
    const groups = new Map<string, FinalCheckItem[]>();
    for (const item of rubric?.final_check_items ?? []) {
      const list = groups.get(item.section) ?? [];
      list.push(item);
      groups.set(item.section, list);
    }
    return [...groups.entries()];
  }, [rubric]);

  const missingReason =
    (sheetResult === 'failed' && !sheetReason.trim()) ||
    (slideResult === 'failed' && !slideReason.trim());

  return (
    <div className="flex flex-col gap-3">
      <LockBanner
        tone="active"
        title="總驗定位：確認初驗問題是否改善，並檢查實際上課用投影片"
        description="不重新跑初驗計分；分別判定教案紙與投影片是否通過，未通過時理由必填。"
      />
      {record && (
        <p className="font-['Noto_Sans_TC'] text-[12px] text-black-500">你已提交過這份總驗；再次送出會更新判定。</p>
      )}

      <p className={PART_TITLE}>一、初驗改善追蹤</p>
      <section className={`${SECTION} px-[14px] py-3`}>
        {initialFeedback.length === 0 ? (
          <p className="font-['Noto_Sans_TC'] text-[13px] text-black-500">
            初驗沒有需要追蹤的修改回饋，請直接進行教案紙與投影片檢核。
          </p>
        ) : (
          <ul className="flex flex-col gap-[10px]">
            {initialFeedback.map((item, index) => (
              <li key={index} className="rounded-[10px] border border-black-100 bg-black-100/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 font-['Noto_Sans_TC'] text-[14px] text-black-900">
                    {item.body}
                  </p>
                  <StatusChip status={FEEDBACK_STATUS_LABEL[item.status] ?? item.status} />
                </div>
                {item.responses.map((response, responseIndex) => (
                  <p
                    key={responseIndex}
                    className="mt-2 rounded-lg bg-black-100 px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[12px] leading-[155%] text-black-700"
                  >
                    <span className="font-bold">作者處理說明：</span>{response}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      {sections.length > 0 && <p className={PART_TITLE}>二、投影片與教案紙檢核</p>}
      {sections.map(([section, items]) => (
        <section key={section} className={SECTION}>
          <div className={SECTION_HEAD}>
            <h3 className={SECTION_TITLE}>{section}</h3>
            <button
              type="button"
              onClick={() =>
                setTicked((prev) => {
                  const next = new Set(prev);
                  items.forEach((item) => next.add(item.id));
                  return next;
                })
              }
              className="font-['Noto_Sans_TC'] text-[13px] text-primary-900 hover:opacity-80 hover:cursor-pointer"
            >
              本區全部通過
            </button>
          </div>
          <p className="px-[14px] pt-2 font-['Noto_Sans_TC'] text-[12px] text-black-500">
            檢核清單只是對照用，系統記錄的是下方的教案紙 / 投影片判定。
          </p>
          <div className="flex flex-col gap-1 px-[14px] pb-[14px] pt-2">
            {items.map((item) => (
              <Checkbox
                key={item.id}
                checked={ticked.has(item.id)}
                onChange={(next) =>
                  setTicked((prev) => {
                    const updated = new Set(prev);
                    if (next) updated.add(item.id);
                    else updated.delete(item.id);
                    return updated;
                  })
                }
                label={item.label}
                className="items-start"
              />
            ))}
          </div>
        </section>
      ))}

      <p className={PART_TITLE}>{sections.length > 0 ? '三' : '二'}、本輪驗收判定</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(
        [
          { key: 'sheet', title: '教案紙判定', value: sheetResult, set: setSheetResult, reason: sheetReason, setReason: setSheetReason },
          { key: 'slide', title: '投影片判定', value: slideResult, set: setSlideResult, reason: slideReason, setReason: setSlideReason },
        ] as const
      ).map((block) => (
        <section key={block.key} className={`${SECTION} px-[14px] py-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={SECTION_TITLE}>{block.title}</h3>
            <VerdictPicker value={block.value} onChange={block.set} />
          </div>
          {block.value === 'failed' && (
            <textarea
              value={block.reason}
              onChange={(event) => block.setReason(event.target.value)}
              placeholder="未通過原因（必填）：請具體說明仍需修改的問題"
              rows={3}
              className={`mt-2 w-full rounded-[10px] border px-3 py-2 font-['Noto_Sans_TC'] text-[14px] ${
                block.reason.trim() ? 'border-black-200' : 'border-status-alert'
              }`}
            />
          )}
        </section>
      ))}
      </div>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-black-200 bg-black-100 px-1 py-3">
        <span className="font-['Noto_Sans_TC'] text-[12px] text-black-500">
          未通過不等於補驗；最終結果仍由教案組決定。
        </span>
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() =>
            onSubmit({
              sheet_result: sheetResult,
              slide_result: slideResult,
              sheet_failed_reason: sheetReason,
              slide_failed_reason: slideReason,
            })
          }
          disabled={submitting || missingReason}
        >
          {submitting ? '送出中…' : record ? '更新總驗判定' : '提交總驗'}
        </button>
      </div>
    </div>
  );
};
