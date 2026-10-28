'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { KeyValueList } from '@/components/ui/Dialog';
import { ScheduleBlock } from '@/features/announcement/ScheduleBlock';
import { BTN } from '@/lib/button-styles';
import type { ScheduleRow } from '@/services/review';

interface ScheduleTabProps {
  termLabel?: string;
  schedules: ScheduleRow[];
  policy: Record<string, boolean> | null;
  onEdit: () => void;
}

const yesNo = (value: boolean | undefined, yes: string, no: string) =>
  value === undefined ? '—' : value ? yes : no;

/** 驗收時程分頁（v13 `adminSettings()`）：時程 timeline + 本期規則摘要。 */
export const ScheduleTab: React.FC<ScheduleTabProps> = ({ termLabel, schedules, policy, onEdit }) => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div>
      <ScheduleBlock termLabel={termLabel} schedules={schedules} />
      <button type="button" className={`${BTN} mt-3`} onClick={onEdit}>
        編輯時程與規則
      </button>
    </div>
    <Card>
      <CardHeader title="規則" description="完整開關在「編輯時程與規則」裡；後端依同一份設定過濾資料，不是只藏 UI。" />
      <KeyValueList
        items={[
          { label: '自己家教案', value: '不可驗收' },
          { label: '初驗計分', value: '起始分數・依未達標項目加權扣分' },
          { label: '結果公開', value: '組長手動發布' },
          {
            label: '總驗驗收者',
            value: yesNo(policy?.final_reuses_initial_reviewers, '沿用初驗', '重新分配'),
          },
          {
            label: '驗收者試算分數',
            value: yesNo(policy?.show_live_score_to_reviewer, '顯示', '不顯示'),
          },
          {
            label: '提交後修改',
            value: yesNo(policy?.reviewer_can_edit_after_submit, '可以', '不可'),
          },
          {
            label: '作者看原始分數',
            value: yesNo(policy?.show_raw_score_to_author, '可以', '不可'),
          },
        ]}
      />
    </Card>
  </div>
);
