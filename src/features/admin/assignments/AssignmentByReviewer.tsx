'use client';

import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { Round } from '@/features/review-shared/types';
import { BTN, BTN_SM } from '@/lib/button-styles';
import { TABLE, TABLE_WRAP, TD, TH, TR } from '@/lib/table-styles';
import type { ReviewerLoadRow } from '@/services/review';

interface AssignmentByReviewerProps {
  round: Round;
  rows: ReviewerLoadRow[];
  /** 某份教案的某個 slot 是否已提交（從驗收結果推得）。 */
  isSlotDone: (jobId: string, slot: string) => boolean;
}

/** 從驗收者檢視（v13 `assignmentReviewerView()`）：份數、點數與完成進度，看工作量是否平均。 */
export const AssignmentByReviewer: React.FC<AssignmentByReviewerProps> = ({ round, rows, isSlotDone }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rows.find((row) => row.reviewer_id === openId) ?? null;

  if (rows.length === 0) {
    return (
      <div className="rounded-[10px] border border-black-200 bg-white px-6 py-10 text-center">
        <p className="font-['Noto_Sans_TC'] text-[14px] text-black-500">本輪還沒有任何分配。</p>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => b.points - a.points);

  return (
    <>
      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-[880px]`}>
          <thead>
            <tr>
              <th className={TH}>驗收者</th>
              <th className={TH}>分配份數</th>
              <th className={TH}>加權點數</th>
              <th className={TH}>已完成</th>
              <th className={TH}>待完成</th>
              <th className={`${TH} w-[160px]`}>驗收進度</th>
              <th className={TH}>被分配教案</th>
              <th className={TH} aria-label="動作" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const done = row.jobs.filter((job) => isSlotDone(job.job_id, job.slot_label)).length;
              const total = row.jobs.length;
              const percent = total ? Math.round((done / total) * 100) : 0;
              return (
                <tr key={row.reviewer_id} className={TR}>
                  <td className={`${TD} font-bold`}>{row.reviewer_name}</td>
                  <td className={TD}>{row.job_count}</td>
                  <td className={TD}>{row.points}</td>
                  <td className={TD}>
                    <StatusChip status={String(done)} tone="done" />
                  </td>
                  <td className={TD}>
                    <StatusChip status={String(total - done)} tone={total - done ? 'active' : 'done'} />
                  </td>
                  <td className={TD}>
                    <div className="h-2 overflow-hidden rounded-full bg-black-100">
                      <div className="h-full rounded-full bg-primary-900" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-[5px] text-[12px] text-black-500">{percent}%</p>
                  </td>
                  <td className={TD}>
                    <div className="flex max-w-[360px] flex-wrap gap-[5px]">
                      {row.jobs.map((job) => (
                        <span
                          key={`${job.job_id}-${job.slot_label}`}
                          className="rounded-lg bg-black-100 px-2 py-[5px] text-[11px] text-black-700"
                        >
                          {job.tp_name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`${TD} text-right`}>
                    <button type="button" className={`${BTN} ${BTN_SM}`} onClick={() => setOpenId(row.reviewer_id)}>
                      查看
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        eyebrow={`${round === 'final' ? '總驗' : '初驗'}驗收者工作量`}
        title={open?.reviewer_name ?? ''}
      >
        {open && (
          <>
            <p className="mb-3 font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
              共 {open.jobs.length} 份教案・{open.points} 點
            </p>
            <ul className="flex flex-col gap-[10px]">
              {open.jobs.map((job) => {
                const done = isSlotDone(job.job_id, job.slot_label);
                return (
                  <li
                    key={`${job.job_id}-${job.slot_label}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black-200 bg-white p-[14px] font-['Noto_Sans_TC']"
                  >
                    <div>
                      <p className="text-[14px] font-bold text-black-900">{job.tp_name}</p>
                      <p className="text-[12px] text-black-500">
                        Slot {job.slot_label}・{job.points} 點
                      </p>
                    </div>
                    <StatusChip status={done ? '已完成' : '待驗收'} tone={done ? 'done' : 'active'} />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Drawer>
    </>
  );
};
