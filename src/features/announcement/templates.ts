import type { AnnouncementType } from '@/services/review';

export interface AnnouncementTemplate {
  key: string;
  name: string;
  description: string;
  type: AnnouncementType;
  /** 選這個模板時預設勾起「同步開放驗收任務」。 */
  opensAssignments?: boolean;
  title: (termLabel: string, roundLabel: string) => string;
  body: (termLabel: string, roundLabel: string) => string;
}

/**
 * 公告撰寫器的常用模板（v13 `announcementTemplates`）。
 * 結果公告要指定教案，留在「本期驗收管理 → 驗收結果」發布，不放在這裡。
 */
export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  {
    key: 'general',
    name: '一般公告',
    description: '純文字公告，不改變任何流程狀態',
    type: 'general',
    title: () => '',
    body: () => '',
  },
  {
    key: 'schedule',
    name: '驗收時程通知',
    description: '公告繳交與驗收截止時間',
    type: 'schedule',
    title: (term, round) => `${term}教案${round}時程與注意事項`,
    body: () =>
      '請各家於指定期限前確認應驗教案與附件完整性，家長確認後請在 Tutoref「家內教案」頁送出驗收。',
  },
  {
    key: 'open_assignment',
    name: '開放驗收任務',
    description: '發布分配，驗收者立刻看得到任務',
    type: 'open_assignment',
    opensAssignments: true,
    title: (term, round) => `${term}${round}驗收任務開放`,
    body: (_term, round) =>
      `${round}驗收分配已完成，請各位驗收者進入 Tutoref「我的驗收任務」查看被分配的教案，並於截止前完成驗收。`,
  },
  {
    key: 'remedial',
    name: '補驗通知',
    description: '通知補驗名單與期限',
    type: 'remedial',
    title: (term) => `${term}補驗通知`,
    body: () => '以下教案需進入補驗，請相關成員依回饋完成修改，並於期限前重新提交。',
  },
];
