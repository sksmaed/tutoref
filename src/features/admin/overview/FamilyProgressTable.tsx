'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { formatDateTime } from '@/features/review-shared/format';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
import type { FamilySubmissionProgress } from '@/services/review';

interface FamilyProgressTableProps {
  rows: FamilySubmissionProgress[];
}

/** 各家送件進度（v13 `adminOverview()` 的表格，D2：放在教案清單頂部）。 */
export const FamilyProgressTable: React.FC<FamilyProgressTableProps> = ({ rows }) => {
  const submitted = rows.filter((row) => row.submitted).length;

  return (
    <Card className="mb-4">
      <CardHeader
        title="各家送件進度"
        description="確認哪些家別已完成本輪教案清點；未送出的家別可優先追蹤。"
        extra={
          <StatusChip
            status={`${submitted}/${rows.length} 已送出`}
            tone={rows.length > 0 && submitted === rows.length ? 'done' : 'active'}
          />
        }
      />
      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-[620px]`}>
          <thead>
            <tr>
              <th className={TH}>家別</th>
              <th className={TH}>送件狀態</th>
              <th className={TH}>待驗收教案</th>
              <th className={TH}>缺交份數</th>
              <th className={TH}>送出時間</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[14px] text-black-500">
                  讀取中或本期沒有家別資料。
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.family_id}-${row.stage}`} className={TR}>
                  <td className={`${TD} font-bold`}>{row.family_name}</td>
                  <td className={TD}>
                    <StatusChip status={row.submitted ? '已送出' : '尚未送出'} tone={row.submitted ? 'done' : 'active'} />
                  </td>
                  <td className={TD}>{row.submitted ? `${row.snapshot_count} 份` : '—'}</td>
                  <td className={`${TD} ${row.missing_total > 0 ? 'text-status-alert' : ''}`}>
                    {row.submitted ? (row.missing_total ? `${row.missing_total} 份` : '0') : '—'}
                  </td>
                  <td className={`${TD} text-[12px] text-black-500`}>
                    {row.submitted ? formatDateTime(row.submitted_at) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
