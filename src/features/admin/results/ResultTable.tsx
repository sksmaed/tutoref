'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/features/review-shared/StatusChip';
import {
  fetchFeedbackItems,
  fetchJobReviews,
  type FeedbackItemRow,
  type FinalRecord,
  type JobReviewRow,
  type ResultRow,
} from '@/services/review';
import type { Round } from '@/features/review-shared/types';

const BAND_LABEL: Record<string, string> = {
  potential_excellent: '潛力優良',
  pass: '通過',
  discussion: '待討論',
  fail: '未通過',
};

const DECISION_LABEL: Record<string, string> = { passed: '通過', remedial: '補驗' };

/** 三個後端狀態對使用者只有兩種意義：還能改 vs 已鎖定。 */
export function decisionLabel(row: ResultRow): string {
  const decision = row.final_decision;
  if (!decision?.decision) return '待處理';
  const name = DECISION_LABEL[decision.decision] ?? decision.decision;
  if (decision.result_state === 'locked') return row.result_published ? '已發布不可改' : '已鎖定';
  return name;
}

/** 總驗沒有分數，看的是教案紙 / 投影片各自通過與否。 */
const RecordCell: React.FC<{ record: FinalRecord | null | undefined }> = ({ record }) => {
  if (!record) return <span className="text-status-idle">未提交</span>;
  const mark = (label: string, result: string) => (
    <span className={result === 'passed' ? 'text-status-done' : 'text-status-alert'}>
      {result === 'passed' ? '✓' : '✗'} {label}
    </span>
  );
  return (
    <span className="flex flex-col items-center text-[13px]">
      {mark('教案紙', record.sheet_result)}
      {mark('投影片', record.slide_result)}
    </span>
  );
};

interface ResultTableProps {
  round: Round;
  rows: ResultRow[];
  selected: Set<string>;
  onToggle: (jobId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  canUnlock: boolean;
  onUnlock: (row: ResultRow) => void;
}

export const ResultTable: React.FC<ResultTableProps> = ({
  round,
  rows,
  selected,
  onToggle,
  onToggleAll,
  canUnlock,
  onUnlock,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackItemRow[] | 'loading'>>({});
  const [reviews, setReviews] = useState<Record<string, JobReviewRow[] | 'loading'>>({});

  const allChecked = rows.length > 0 && rows.every((row) => selected.has(row.job_id));

  // 點列展開該份的 reviewer feedback（回饋在初驗結果發布時才產生）
  const toggleExpand = async (row: ResultRow) => {
    if (expanded === row.job_id) {
      setExpanded(null);
      return;
    }
    setExpanded(row.job_id);
    // reviewer 寫了什麼是判定當下就要看到的；FeedbackItem 要發布後才有，兩個都撈
    if (!reviews[row.job_id]) {
      setReviews((prev) => ({ ...prev, [row.job_id]: 'loading' }));
      try {
        const rows = await fetchJobReviews(row.job_id);
        setReviews((prev) => ({ ...prev, [row.job_id]: rows }));
      } catch {
        setReviews((prev) => ({ ...prev, [row.job_id]: [] }));
      }
    }
    if (!feedback[row.job_id]) {
      setFeedback((prev) => ({ ...prev, [row.job_id]: 'loading' }));
      try {
        const items = await fetchFeedbackItems(row.job_id);
        setFeedback((prev) => ({ ...prev, [row.job_id]: items }));
      } catch {
        setFeedback((prev) => ({ ...prev, [row.job_id]: [] }));
      }
    }
  };

  return (
    <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <table className="w-full min-w-[900px] border-collapse text-[14px] font-['Noto_Sans_TC']">
        <thead>
          <tr className="bg-primary-100 font-bold text-black-900">
            <th className="h-[48px] w-[52px] px-2 text-center">
              <span className="inline-flex justify-center">
                <Checkbox checked={allChecked} onChange={onToggleAll} label="" />
              </span>
            </th>
            <th className="h-[48px] px-4 text-left">教案</th>
            <th className="h-[48px] w-[80px] px-2 text-center">家別</th>
            {round === 'final' ? (
              <>
                <th className="h-[48px] w-[110px] px-2 text-center">A 判定</th>
                <th className="h-[48px] w-[110px] px-2 text-center">B 判定</th>
              </>
            ) : (
              <>
                <th className="h-[48px] w-[70px] px-2 text-center">A</th>
                <th className="h-[48px] w-[70px] px-2 text-center">B</th>
                <th className="h-[48px] w-[80px] px-2 text-center">平均</th>
                <th className="h-[48px] w-[100px] px-2 text-center">系統訊號</th>
              </>
            )}
            <th className="h-[48px] w-[110px] px-2 text-center">Feedback</th>
            <th className="h-[48px] w-[120px] px-2 text-center">最終結果</th>
            <th className="h-[48px] w-[80px] px-2 text-center" />
          </tr>
        </thead>
        <tbody className="divide-y divide-black-200 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={round === 'final' ? 8 : 10} className="h-[80px] text-center text-black-700">
                本輪還沒有任何驗收任務。
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const locked = row.final_decision?.result_state === 'locked';
              const items = feedback[row.job_id];
              const reviewRows = reviews[row.job_id];
              return (
                <React.Fragment key={row.job_id}>
                  <tr className={`transition-colors hover:bg-primary-100 ${locked ? 'bg-status-locked-bg' : ''}`}>
                    <td className="h-[56px] px-2 text-center">
                      <span className={`inline-flex justify-center ${locked ? 'pointer-events-none opacity-50' : ''}`}>
                        <Checkbox
                          checked={selected.has(row.job_id)}
                          onChange={(next) => !locked && onToggle(row.job_id, next)}
                          label=""
                        />
                      </span>
                    </td>
                    <td className="h-[56px] px-4">
                      <button
                        type="button"
                        onClick={() => void toggleExpand(row)}
                        className="block max-w-full truncate text-left hover:text-primary-900 hover:cursor-pointer"
                        title={row.tp_name}
                      >
                        {expanded === row.job_id ? '▾ ' : '▸ '}
                        {row.tp_name}
                      </button>
                    </td>
                    <td className="h-[56px] px-2 text-center">{row.family}</td>
                    {round === 'final' ? (
                      <>
                        <td className="h-[56px] px-2 text-center">
                          <RecordCell record={row.records?.A} />
                        </td>
                        <td className="h-[56px] px-2 text-center">
                          <RecordCell record={row.records?.B} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="h-[56px] px-2 text-center">{row.score_a ?? '—'}</td>
                        <td className="h-[56px] px-2 text-center">{row.score_b ?? '—'}</td>
                        <td className="h-[56px] px-2 text-center font-bold">{row.average ?? '—'}</td>
                        <td className="h-[56px] px-2 text-center">
                          {row.band ? BAND_LABEL[row.band] ?? row.band : '—'}
                        </td>
                      </>
                    )}
                    <td className="h-[56px] px-2 text-center text-[13px]">
                      {row.feedback_progress.total === 0
                        ? '尚未產生'
                        : `${row.feedback_progress.done} / ${row.feedback_progress.total}`}
                    </td>
                    <td className="h-[56px] px-2 text-center">
                      <StatusChip status={decisionLabel(row)} />
                    </td>
                    <td className="h-[56px] px-2 text-center">
                      {locked && !row.result_published && canUnlock && (
                        <button
                          type="button"
                          onClick={() => onUnlock(row)}
                          className="text-[13px] text-primary-900 hover:opacity-80 hover:cursor-pointer"
                        >
                          解鎖
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === row.job_id && (
                    <tr className="bg-black-100">
                      <td colSpan={round === 'final' ? 8 : 10} className="px-6 py-4">
                        {row.final_decision?.reason && (
                          <p className="mb-2 text-[13px] text-black-700">
                            判定理由：{row.final_decision.reason}
                          </p>
                        )}
                        {round === 'final' &&
                          (['A', 'B'] as const).map((slot) => {
                            const record = row.records?.[slot];
                            if (!record) return null;
                            const reasons = [
                              record.sheet_result === 'failed' ? `教案紙：${record.sheet_failed_reason}` : null,
                              record.slide_result === 'failed' ? `投影片：${record.slide_failed_reason}` : null,
                            ].filter(Boolean);
                            if (reasons.length === 0) return null;
                            return (
                              <p key={slot} className="mb-1 text-[13px] text-status-alert">
                                {slot} 未通過理由——{reasons.join('；')}
                              </p>
                            );
                          })}
                        {/* 判定當下要看的是 reviewer 寫了什麼，不是等發布後的 FeedbackItem */}
                        {reviewRows === 'loading' ? (
                          <p className="text-[13px] text-black-500">載入中…</p>
                        ) : (
                          <div className="mb-3 grid gap-3 sm:grid-cols-2">
                            {(reviewRows ?? []).map((review) => (
                              <div
                                key={review.slot_label}
                                className="rounded-lg border border-black-200 bg-white px-3 py-2"
                              >
                                <p className="text-[13px] font-bold text-black-900">
                                  {review.slot_label}・{review.reviewer_name}
                                  {review.score && (
                                    <span className="ml-2 font-normal text-black-700">{review.score} 分</span>
                                  )}
                                </p>
                                {!review.review_state ? (
                                  <p className="mt-1 text-[13px] text-status-idle">尚未提交</p>
                                ) : (
                                  <>
                                    {review.overall_comment && (
                                      <p className="mt-1 text-[13px] text-black-900">
                                        {review.overall_comment}
                                      </p>
                                    )}
                                    {review.checked_items.length > 0 && (
                                      <ul className="mt-1 flex flex-col gap-[2px]">
                                        {review.checked_items.map((item, index) => (
                                          <li key={index} className="text-[12px] text-black-700">
                                            <span className="text-status-alert">−{item.deduction_value}</span>{' '}
                                            {item.label}
                                            {item.reason && `：${item.reason}`}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {review.private_note && (
                                      <p className="mt-1 text-[12px] text-black-500">
                                        內部備註：{review.private_note}
                                      </p>
                                    )}
                                    {review.record && (
                                      <p className="mt-1 text-[12px] text-black-700">
                                        教案紙 {review.record.sheet_result === 'passed' ? '通過' : '未通過'}・
                                        投影片 {review.record.slide_result === 'passed' ? '通過' : '未通過'}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {items === 'loading' ? null : !items || items.length === 0 ? (
                          <p className="text-[13px] text-black-500">
                            給作者的回饋會在發布結果時產生，目前這份還沒有。
                          </p>
                        ) : (
                          <ul className="flex flex-col gap-1">
                            {items.map((item) => (
                              <li key={item.id} className="text-[13px] text-black-900">
                                <span className="text-black-500">
                                  {item.reviewer_name ? `${item.reviewer_name}・` : ''}
                                  {item.status === 'todo' ? '待處理' : '已處理'}
                                </span>
                                　{item.body}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
