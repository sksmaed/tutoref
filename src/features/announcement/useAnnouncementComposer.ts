'use client';

import { useCallback, useState } from 'react';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';
import {
  publishAnnouncement,
  publishAssignments,
  type AnnouncementType,
} from '@/services/review';

export interface ComposerInput {
  round: Round;
  type: AnnouncementType;
  title: string;
  body: string;
  sendEmail: boolean;
  /** 勾選「同步開放驗收任務」：改走發布分配，公告類型就是開放驗收任務。 */
  openAssignments: boolean;
}

/** 公告發布流程：一般公告直接發；開放任務走 publishAssignments（後端會一併建立公告）。 */
export function useAnnouncementComposer() {
  const { context, reload: reloadContext } = useTermContext();
  const termId = context?.current_term?.id ?? null;
  const [publishing, setPublishing] = useState(false);

  const publish = useCallback(
    async (input: ComposerInput) => {
      if (!termId) throw new Error('目前沒有進行中的期別');
      setPublishing(true);
      try {
        if (input.openAssignments) {
          await publishAssignments(termId, input.round, {
            title: input.title,
            body: input.body,
            send_email: input.sendEmail,
          });
          // 分配發布會改變 stage_state，側欄與任務頁都要跟著更新
          await reloadContext();
        } else {
          await publishAnnouncement({
            term_id: termId,
            announcement_type: input.type,
            title: input.title,
            body: input.body,
            send_email: input.sendEmail,
          });
        }
      } finally {
        setPublishing(false);
      }
    },
    [reloadContext, termId]
  );

  return { publish, publishing, termId };
}
