'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { formatDateTime } from '@/features/review-shared/format';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
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
}

/** 家內教案清單（v13 `renderReviewMyLessons()` 家長分支）。 */
export const FamilyReviewTable: React.FC<FamilyReviewTableProps> = ({
  plans,
  locked,
  selected,
  onToggle,
}) => (
  <div className={TABLE_WRAP}>
    <table className={`${TABLE} min-w-[860px]`}>
      <thead>
        <tr>
          <th className={TH}>教案名稱</th>
          <th className={TH}>撰寫者</th>
          <th className={TH}>類別</th>
          <th className={TH}>
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
          <th className={TH}>納入本輪驗收</th>
          <th className={TH}>送出快照</th>
          <th className={TH}>目前狀態</th>
        </tr>
      </thead>
      <tbody>
        {plans.length === 0 ? (
          <tr>
            <td colSpan={7} className="py-12 text-center text-[15px] text-black-500">
              本期這一家還沒有教案。
            </td>
          </tr>
        ) : (
          plans.map((plan) => {
            const checked = locked ? plan.included : selected.has(plan.plan_id);
            const complete = plan.sheet_present && plan.slide_present;
            return (
              <tr key={plan.plan_id} className={`${TR} ${locked ? 'bg-black-100/40' : ''}`}>
                <td className={TD}>
                  <p className="font-bold">{plan.tp_name}</p>
                  <p className="mt-[2px] text-[12px] text-black-500">
                    {plan.grade}・{plan.duration} 分鐘
                  </p>
                </td>
                <td className={TD}>{plan.writer_names.join('、') || '—'}</td>
                <td className={TD}>{plan.category}</td>
                <td className={TD}>
                  <StatusChip status={complete ? '完整' : '缺附件'} tone={complete ? 'done' : 'active'} />
                  {!complete && (
                    <p className="mt-1 text-[12px] text-black-500">
                      缺{!plan.sheet_present && '教案紙'}
                      {!plan.sheet_present && !plan.slide_present && '、'}
                      {!plan.slide_present && '投影片'}
                    </p>
                  )}
                </td>
                <td className={TD}>
                  <select
                    value={checked ? 'yes' : 'no'}
                    disabled={locked}
                    onChange={(event) => onToggle(plan.plan_id, event.target.value === 'yes')}
                    aria-label={`${plan.tp_name} 是否納入本輪驗收`}
                    className="min-w-[96px] rounded-[10px] border border-black-200 bg-white px-[10px] py-[7px] text-[14px] text-black-900 disabled:cursor-not-allowed disabled:bg-black-100 disabled:text-black-500"
                  >
                    <option value="yes">是</option>
                    <option value="no">否</option>
                  </select>
                </td>
                <td className={TD}>
                  {plan.snapshot?.submitted_at ? (
                    <>
                      <StatusChip status="已凍結" />
                      <p className="mt-1 text-[12px] text-black-500">{formatDateTime(plan.snapshot.submitted_at)}</p>
                    </>
                  ) : (
                    <span className="text-black-500">—</span>
                  )}
                </td>
                <td className={TD}>
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
