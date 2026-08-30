'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';

/** 只列出目前前端真的會依賴的開關，其餘欄位仍由後端保管。 */
const POLICY_LABELS: { key: string; label: string; hint?: string }[] = [
  { key: 'show_raw_score_to_author', label: '作者可看到原始分數' },
  { key: 'show_deduction_detail_to_author', label: '作者可看到扣分細項' },
  { key: 'reviewer_anonymous_to_author', label: 'Reviewer 對作者匿名' },
  { key: 'parent_can_see_raw_score', label: '家長可看到原始分數' },
  { key: 'show_live_score_to_reviewer', label: 'Reviewer 表單顯示試算分數' },
  { key: 'reviewer_can_edit_after_submit', label: 'Reviewer 提交後可修改' },
  { key: 'leader_can_edit_schedule', label: '組長可編輯時程' },
  { key: 'leader_can_edit_rubric', label: '組長可編輯驗收標準' },
  { key: 'leader_can_view_audit', label: '組長可看稽核紀錄' },
  { key: 'leader_can_unlock_result', label: '組長可解鎖結果' },
  { key: 'leader_can_reopen_submission', label: '組長可重開送件' },
  { key: 'coauthor_can_edit', label: '共同作者可編輯' },
  { key: 'coauthor_can_delete', label: '共同作者可刪除' },
  { key: 'remedial_frontend_enabled', label: '開放補驗前台' },
  { key: 'final_reuses_initial_reviewers', label: '總驗沿用初驗的 reviewer' },
];

interface PolicySettingsProps {
  policy: Record<string, boolean> | null;
  saving: boolean;
  onToggle: (key: string, value: boolean) => void;
}

export const PolicySettings: React.FC<PolicySettingsProps> = ({ policy, saving, onToggle }) => {
  if (!policy) return null;

  return (
    <section className="mt-4 rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
      <h3 className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">本期規則</h3>
      <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700">
        這些開關決定各角色看得到什麼、能做什麼。後端會依同一份設定過濾資料，不是只藏 UI。
      </p>

      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {POLICY_LABELS.filter((item) => item.key in policy).map((item) => (
          <span key={item.key} className={saving ? 'pointer-events-none opacity-60' : ''}>
            <Checkbox
              checked={!!policy[item.key]}
              onChange={(next) => onToggle(item.key, next)}
              label={item.label}
            />
          </span>
        ))}
      </div>
    </section>
  );
};
