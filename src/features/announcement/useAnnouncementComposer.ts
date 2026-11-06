'use client';

import { useCallback, useState } from 'react';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';
import {
  fetchAnnouncementDrafts,
  publishAnnouncement,
  publishAnnouncementDraft,
  publishAssignments,
  saveAnnouncementDraft,
  updateAnnouncementDraft,
  type AnnouncementRow,
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
  /** 正在編輯的草稿；有值時發布會先更新草稿內容再發布它。 */
  draftId: string | null;
}

/**
 * 公告發布流程：
 * - 一般公告：直接發，或先存成草稿（只有建立者看得到）之後再發。
 * - 開放任務：走 publishAssignments（後端會一併建立公告），不支援草稿。
 */
export function useAnnouncementComposer() {
  const { context, reload: reloadContext } = useTermContext();
  const termId = context?.current_term?.id ?? null;
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [drafts, setDrafts] = useState<AnnouncementRow[]>([]);

  const reloadDrafts = useCallback(async () => {
    if (!termId) return;
    try {
      setDrafts(await fetchAnnouncementDrafts(termId));
    } catch {
      setDrafts([]);
    }
  }, [termId]);

  /** 存草稿；回傳草稿（新建時帶回新的 id）。 */
  const saveDraft = useCallback(
    async (input: Omit<ComposerInput, 'round' | 'openAssignments'>) => {
      if (!termId) throw new Error('目前沒有進行中的期別');
      setSavingDraft(true);
      try {
        const fields = {
          announcement_type: input.type,
          title: input.title,
          body: input.body,
          send_email: input.sendEmail,
        };
        const row = input.draftId
          ? await updateAnnouncementDraft(input.draftId, fields)
          : await saveAnnouncementDraft({ term_id: termId, ...fields });
        await reloadDrafts();
        return row;
      } finally {
        setSavingDraft(false);
      }
    },
    [reloadDrafts, termId]
  );

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
        } else if (input.draftId) {
          await updateAnnouncementDraft(input.draftId, {
            announcement_type: input.type,
            title: input.title,
            body: input.body,
            send_email: input.sendEmail,
          });
          await publishAnnouncementDraft(input.draftId);
          await reloadDrafts();
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
    [reloadContext, reloadDrafts, termId]
  );

  return { publish, publishing, saveDraft, savingDraft, drafts, reloadDrafts, termId };
}
