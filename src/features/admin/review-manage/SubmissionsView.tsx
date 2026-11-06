'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FamilyProgressTable } from '@/features/admin/overview/FamilyProgressTable';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { formatDateTime } from '@/features/review-shared/format';
import type { Round } from '@/features/review-shared/types';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
import { fetchAllFamilyPlans, type FamilyPlan, type FamilySubmissionProgress } from '@/services/review';

type Filter = 'all' | 'submitted' | 'not_submitted' | 'missing_file';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部繳交狀態' },
  { key: 'submitted', label: '已送出驗收' },
  { key: 'not_submitted', label: '尚未送出' },
  { key: 'missing_file', label: '缺檔' },
];

type Row = FamilyPlan & { family: string; familySubmitted: boolean };

function parentLabel(row: Row): { text: string; tone: 'done' | 'idle' | 'active' } {
  if (!row.familySubmitted) return { text: '尚未送出', tone: 'idle' };
  return row.included ? { text: '已送出', tone: 'done' } : { text: '未納入本輪', tone: 'idle' };
}

interface SubmissionsViewProps {
  round: Round;
  progress: FamilySubmissionProgress[];
}

/** 教案清單（v13 `adminSubmissions()`）：各家送件進度 + 全團本輪教案。 */
export const SubmissionsView: React.FC<SubmissionsViewProps> = ({ round, progress }) => {
  const [plans, setPlans] = useState<FamilyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllFamilyPlans(round)
      .then((data) => !cancelled && setPlans(data))
      .catch(() => !cancelled && setPlans([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [round]);

  // 家長確認狀態看該家有沒有送出本輪
  const rows = useMemo<Row[]>(() => {
    const submittedById = new Map(progress.map((family) => [family.family_id, family.submitted]));
    return plans.map((plan) => ({
      ...plan,
      family: plan.family_name ?? '—',
      familySubmitted: !!(plan.family_id && submittedById.get(plan.family_id)),
    }));
  }, [plans, progress]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (keyword && !`${row.tp_name} ${row.writer_names.join(' ')}`.toLowerCase().includes(keyword)) return false;
      if (filter === 'submitted') return row.familySubmitted && row.included;
      if (filter === 'not_submitted') return !row.familySubmitted;
      if (filter === 'missing_file') return !row.sheet_present || !row.slide_present;
      return true;
    });
  }, [filter, query, rows]);

  return (
    <>
      <FamilyProgressTable rows={progress} />

      <div className="mb-4 flex flex-wrap items-center gap-[10px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋作者或教案…"
          className="min-w-[240px] flex-1 rounded-[10px] border border-black-200 bg-white px-3 py-[9px] font-['Noto_Sans_TC'] text-[14px] outline-none focus:border-primary-700"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          className="rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px]"
        >
          {FILTERS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-[820px]`}>
          <thead>
            <tr>
              <th className={TH}>作者</th>
              <th className={TH}>家別</th>
              <th className={TH}>教案</th>
              <th className={TH}>教案紙</th>
              <th className={TH}>投影片</th>
              <th className={TH}>家長確認</th>
              <th className={TH}>送出時間</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[14px] text-black-500">讀取中…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[14px] text-black-500">沒有符合條件的教案。</td>
              </tr>
            ) : (
              visible.map((row) => {
                const parent = parentLabel(row);
                return (
                  <tr key={row.plan_id} className={TR}>
                    <td className={TD}>{row.writer_names.join('、') || '—'}</td>
                    <td className={TD}>{row.family}</td>
                    <td className={`${TD} font-bold`}>{row.tp_name}</td>
                    <td className={TD}>
                      <StatusChip status={row.sheet_present ? '已繳' : '缺少'} tone={row.sheet_present ? 'done' : 'alert'} />
                    </td>
                    <td className={TD}>
                      <StatusChip status={row.slide_present ? '已繳' : '缺少'} tone={row.slide_present ? 'done' : 'active'} />
                    </td>
                    <td className={TD}>
                      <StatusChip status={parent.text} tone={parent.tone} />
                    </td>
                    <td className={`${TD} text-[12px] text-black-500`}>
                      {row.snapshot?.submitted_at ? formatDateTime(row.snapshot.submitted_at) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
