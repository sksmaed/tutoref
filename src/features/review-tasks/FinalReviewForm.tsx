'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/features/review-shared/StatusChip';
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
        className={`rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${
          value === option
            ? option === 'passed'
              ? 'bg-status-done text-white'
              : 'bg-status-alert text-white'
            : 'bg-white text-black-700 hover:bg-primary-100'
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
    <div className="flex flex-col gap-4">
      <section className="rounded-lg bg-white px-4 py-3 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">初驗改善追蹤</h3>
        {initialFeedback.length === 0 ? (
          <p className="mt-2 font-['Noto_Sans_TC'] text-[13px] text-black-500">
            這份教案沒有初驗回饋紀錄。
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {initialFeedback.map((item, index) => (
              <li key={index} className="border-b border-black-100 pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 font-['Noto_Sans_TC'] text-[14px] text-black-900">
                    {item.body}
                  </p>
                  <StatusChip status={FEEDBACK_STATUS_LABEL[item.status] ?? item.status} />
                </div>
                {item.responses.map((response, responseIndex) => (
                  <p
                    key={responseIndex}
                    className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700"
                  >
                    作者：{response}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      {sections.map(([section, items]) => (
        <section key={section} className="rounded-lg bg-white px-4 py-3 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">{section}</h3>
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
          <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-black-500">
            檢核清單只是對照用，系統記錄的是下方的教案紙 / 投影片判定。
          </p>
          <div className="mt-2 flex flex-col gap-1">
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

      {(
        [
          { key: 'sheet', title: '教案紙判定', value: sheetResult, set: setSheetResult, reason: sheetReason, setReason: setSheetReason },
          { key: 'slide', title: '投影片判定', value: slideResult, set: setSlideResult, reason: slideReason, setReason: setSlideReason },
        ] as const
      ).map((block) => (
        <section key={block.key} className="rounded-lg bg-white px-4 py-3 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">{block.title}</h3>
            <VerdictPicker value={block.value} onChange={block.set} />
          </div>
          {block.value === 'failed' && (
            <input
              type="text"
              value={block.reason}
              onChange={(event) => block.setReason(event.target.value)}
              placeholder="未通過必須填寫理由"
              className={`mt-2 w-full rounded-lg border px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${
                block.reason.trim() ? 'border-black-200' : 'border-status-alert'
              }`}
            />
          )}
        </section>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-['Noto_Sans_TC'] text-[13px] text-black-500">
          未通過不等於補驗；最終結果仍由教案組決定。
        </span>
        <Button
          onClick={() =>
            onSubmit({
              sheet_result: sheetResult,
              slide_result: slideResult,
              sheet_failed_reason: sheetReason,
              slide_failed_reason: slideReason,
            })
          }
          disabled={submitting || missingReason}
          className="bg-primary-900 px-6 py-2 font-bold text-white"
        >
          {submitting ? '送出中…' : record ? '更新總驗判定' : '送出總驗判定'}
        </Button>
      </div>
    </div>
  );
};
