'use client';

import { useEffect, useMemo } from 'react';
import { useAssignmentBoard } from '@/features/admin/assignments/useAssignmentBoard';
import type { Round } from '@/features/review-shared/types';

interface OpenAssignmentImpactProps {
  round: Round;
  sendEmail: boolean;
  /** 不能開放時回報原因（null = 可以開放）。 */
  onBlockedChange: (reason: string | null) => void;
}

/**
 * 開放任務的影響摘要：不可逆動作值得一個具體的確認畫面（§6.7）。
 * 只在勾選「同步開放驗收任務」時掛載，避免每次開撰寫器都去抓整份分配。
 */
export function OpenAssignmentImpact({ round, sendEmail, onBlockedChange }: OpenAssignmentImpactProps) {
  const board = useAssignmentBoard(round);

  const reviewerCount = useMemo(() => {
    const ids = new Set<string>();
    Object.values(board.slots).forEach((jobSlots) =>
      Object.values(jobSlots).forEach((id) => id && ids.add(id))
    );
    return ids.size;
  }, [board.slots]);

  const blocked = board.loading
    ? '正在讀取本輪分配…'
    : board.error
      ? board.error
      : board.jobs.length === 0
        ? '本輪還沒有任何送件，沒有可發布的任務。'
        : board.assignmentCount === 0
          ? '本輪還沒有儲存任何分配，請先到「本期驗收管理 → 分配」完成並儲存。'
          : null;

  useEffect(() => {
    onBlockedChange(blocked);
  }, [blocked, onBlockedChange]);

  return (
    <div
      className={`mt-2 rounded-lg px-4 py-3 font-['Noto_Sans_TC'] text-[13px] ${
        blocked ? 'bg-status-alert-bg text-status-alert' : 'bg-status-active-bg text-status-active'
      }`}
    >
      {blocked ?? (
        <>
          將開放 <span className="font-bold">{board.jobs.length}</span> 份任務給{' '}
          <span className="font-bold">{reviewerCount}</span> 位驗收者
          {sendEmail ? `，並寄出 ${reviewerCount} 封信` : ''}。發布後無法撤回。
        </>
      )}
    </div>
  );
}
