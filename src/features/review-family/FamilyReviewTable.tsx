'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { SnapshotBox } from '@/features/review-shared/SnapshotBox';
import type { FamilyPlan } from '@/services/review';

/** 檔案完整性的判準寫在畫面上——prototype 回饋直接問了「系統怎麼判斷」（§6.1）。 */
export const FILE_COMPLETENESS_HINT = '判準：教案紙與投影片都有連結。缺投影片仍可送出，但驗收時會標記缺附件。';

const JOB_STATE_LABEL: Record<string, string> = {
  draft: '待分配',
  assignment_saved: '待分配',
  assignment_published: '待驗收',
  in_review: '驗收中',
  review_closed: '待處理',
  result_locked: '已鎖定',
  result_published: '已完成',
  cancelled: '未納入本輪',
};

export function planStatusLabel(plan: FamilyPlan, locked: boolean): string {
  if (!locked) return '尚未送出';
  if (!plan.included) return '未納入本輪';
  return JOB_STATE_LABEL[plan.job_state ?? ''] ?? '已送出';
}

interface FamilyReviewTableProps {
  plans: FamilyPlan[];
  /** 本輪已送出 = 整份清單唯讀。 */
  locked: boolean;
  selected: Set<string>;
  onToggle: (planId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}

const FileMark: React.FC<{ label: string; present: boolean }> = ({ label, present }) => (
  <span className={present ? 'text-status-done' : 'text-status-alert'}>
    {present ? '✓' : '✗'} {label}
  </span>
);

export const FamilyReviewTable: React.FC<FamilyReviewTableProps> = ({
  plans,
  locked,
  selected,
  onToggle,
  onToggleAll,
}) => {
  const allChecked = plans.length > 0 && plans.every((plan) => selected.has(plan.plan_id));

  return (
    <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <table className="w-full min-w-[860px] border-collapse text-[14px] font-['Noto_Sans_TC']">
        <thead>
          <tr className="bg-primary-100 text-black-900 font-bold">
            <th className="h-[48px] w-[56px] px-2 text-center">
              {!locked && (
                <span className="inline-flex justify-center">
                  <Checkbox checked={allChecked} onChange={onToggleAll} label="" />
                </span>
              )}
            </th>
            <th className="h-[48px] px-4 text-left">教案名稱</th>
            <th className="h-[48px] w-[110px] px-2 text-center">撰寫者</th>
            <th className="h-[48px] w-[80px] px-2 text-center">類別</th>
            <th className="h-[48px] w-[150px] px-2 text-center">
              <span className="inline-flex items-center gap-1">
                檔案完整性
                <span
                  title={FILE_COMPLETENESS_HINT}
                  aria-label={FILE_COMPLETENESS_HINT}
                  className="inline-flex h-[16px] w-[16px] cursor-help items-center justify-center rounded-full border border-black-400 text-[11px] font-normal text-black-500"
                >
                  ?
                </span>
              </span>
            </th>
            <th className="h-[48px] w-[110px] px-2 text-center">納入本輪</th>
            <th className="h-[48px] w-[160px] px-2 text-center">送出快照</th>
            <th className="h-[48px] w-[110px] px-2 text-center">目前狀態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black-200 bg-white">
          {plans.length === 0 ? (
            <tr>
              <td colSpan={8} className="h-[80px] text-center text-black-700">
                本期這一家還沒有教案。
              </td>
            </tr>
          ) : (
            plans.map((plan) => {
              const checked = locked ? plan.included : selected.has(plan.plan_id);
              return (
                <tr key={plan.plan_id} className="hover:bg-primary-100 transition-colors">
                  <td className="h-[56px] px-2 text-center">
                    <span className="inline-flex justify-center">
                      <Checkbox
                        checked={checked}
                        onChange={(next) => !locked && onToggle(plan.plan_id, next)}
                        label=""
                        className={locked ? 'pointer-events-none opacity-60' : ''}
                      />
                    </span>
                  </td>
                  <td className="h-[56px] px-4">
                    <span className="block truncate" title={plan.tp_name}>
                      {plan.tp_name}
                    </span>
                    <span className="text-[12px] text-black-500">
                      {plan.grade}・{plan.duration} 分鐘
                    </span>
                  </td>
                  <td className="h-[56px] px-2 text-center">{plan.writer_names.join('、') || '—'}</td>
                  <td className="h-[56px] px-2 text-center">{plan.category}</td>
                  <td className="h-[56px] px-2 text-center">
                    <span className="flex items-center justify-center gap-2 text-[13px]">
                      <FileMark label="教案紙" present={plan.sheet_present} />
                      <FileMark label="投影片" present={plan.slide_present} />
                    </span>
                  </td>
                  <td className="h-[56px] px-2 text-center">
                    <StatusChip
                      status={checked ? '納入' : '未納入本輪'}
                      tone={checked ? 'active' : 'idle'}
                    />
                  </td>
                  <td className="h-[56px] px-2 text-center">
                    <SnapshotBox
                      compact
                      submittedAt={plan.snapshot?.submitted_at}
                      sheetPresent={plan.snapshot?.sheet_present}
                      slidePresent={plan.snapshot?.slide_present}
                    />
                  </td>
                  <td className="h-[56px] px-2 text-center">
                    <StatusChip status={planStatusLabel(plan, locked)} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
