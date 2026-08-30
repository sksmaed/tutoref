'use client';

import React from 'react';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { formatDateTime } from '@/features/review-shared/format';
import type { FamilySubmissionProgress } from '@/services/review';

interface FamilyProgressTableProps {
  rows: FamilySubmissionProgress[];
}

/** 六家送件進度。「教案繳交」不另開 tab，進度放這裡就夠（§3.2）。 */
export const FamilyProgressTable: React.FC<FamilyProgressTableProps> = ({ rows }) => {
  const submitted = rows.filter((row) => row.submitted).length;
  const plans = rows.reduce((total, row) => total + row.snapshot_count, 0);
  const missing = rows.reduce((total, row) => total + row.missing_total, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {[
          { label: '已送件家數', value: `${submitted} / ${rows.length}` },
          { label: '進入驗收教案', value: plans },
          { label: '缺交註記', value: missing },
        ].map((card) => (
          <div
            key={card.label}
            className="min-w-[150px] flex-1 rounded-lg bg-white px-4 py-3 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]"
          >
            <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">{card.label}</p>
            <p className="font-['Noto_Sans_TC'] text-[24px] font-bold text-primary-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full overflow-x-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
        <table className="w-full min-w-[620px] border-collapse text-[14px] font-['Noto_Sans_TC']">
          <thead>
            <tr className="bg-primary-100 font-bold text-black-900">
              <th className="h-[48px] px-4 text-left">家別</th>
              <th className="h-[48px] w-[110px] px-2 text-center">送件狀態</th>
              <th className="h-[48px] w-[180px] px-2 text-center">送出時間</th>
              <th className="h-[48px] w-[110px] px-2 text-center">送驗份數</th>
              <th className="h-[48px] w-[110px] px-2 text-center">缺交份數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black-200 bg-white">
            {rows.map((row) => (
              <tr key={`${row.family_id}-${row.stage}`} className="transition-colors hover:bg-primary-100">
                <td className="h-[52px] px-4">{row.family_name}</td>
                <td className="h-[52px] px-2 text-center">
                  <StatusChip status={row.submitted ? '已送出' : '尚未送出'} />
                </td>
                <td className="h-[52px] px-2 text-center text-[13px]">
                  {row.submitted ? formatDateTime(row.submitted_at) : '—'}
                </td>
                <td className="h-[52px] px-2 text-center">{row.snapshot_count}</td>
                <td className={`h-[52px] px-2 text-center ${row.missing_total > 0 ? 'text-status-alert' : ''}`}>
                  {row.missing_total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
