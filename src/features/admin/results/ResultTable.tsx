'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { fetchFeedbackItems, type FeedbackItemRow, type ResultRow } from '@/services/review';

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

interface ResultTableProps {
  rows: ResultRow[];
  selected: Set<string>;
  onToggle: (jobId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  canUnlock: boolean;
  onUnlock: (row: ResultRow) => void;
}

export const ResultTable: React.FC<ResultTableProps> = ({
  rows,
  selected,
  onToggle,
  onToggleAll,
  canUnlock,
  onUnlock,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackItemRow[] | 'loading'>>({});

  const allChecked = rows.length > 0 && rows.every((row) => selected.has(row.job_id));

  // 點列展開該份的 reviewer feedback（回饋在初驗結果發布時才產生）
  const toggleExpand = async (row: ResultRow) => {
    if (expanded === row.job_id) {
      setExpanded(null);
      return;
    }
    setExpanded(row.job_id);
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
            <th className="h-[48px] w-[70px] px-2 text-center">A</th>
            <th className="h-[48px] w-[70px] px-2 text-center">B</th>
            <th className="h-[48px] w-[80px] px-2 text-center">平均</th>
            <th className="h-[48px] w-[100px] px-2 text-center">系統訊號</th>
            <th className="h-[48px] w-[110px] px-2 text-center">Feedback</th>
            <th className="h-[48px] w-[120px] px-2 text-center">最終結果</th>
            <th className="h-[48px] w-[80px] px-2 text-center" />
          </tr>
        </thead>
        <tbody className="divide-y divide-black-200 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="h-[80px] text-center text-black-700">
                本輪還沒有任何驗收任務。
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const locked = row.final_decision?.result_state === 'locked';
              const items = feedback[row.job_id];
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
                    <td className="h-[56px] px-2 text-center">{row.score_a ?? '—'}</td>
                    <td className="h-[56px] px-2 text-center">{row.score_b ?? '—'}</td>
                    <td className="h-[56px] px-2 text-center font-bold">{row.average ?? '—'}</td>
                    <td className="h-[56px] px-2 text-center">
                      {row.band ? BAND_LABEL[row.band] ?? row.band : '—'}
                    </td>
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
                      <td colSpan={10} className="px-6 py-4">
                        {row.final_decision?.reason && (
                          <p className="mb-2 text-[13px] text-black-700">
                            判定理由：{row.final_decision.reason}
                          </p>
                        )}
                        {items === 'loading' ? (
                          <p className="text-[13px] text-black-500">載入中…</p>
                        ) : !items || items.length === 0 ? (
                          <p className="text-[13px] text-black-500">
                            回饋會在初驗結果發布時產生，目前這份還沒有。
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
