import type { Capability } from './types';

export interface ReviewSection {
  key: string;
  label: string;
  href: string;
  /** 給陣列代表「其中一個就夠」。 */
  capability: Capability | Capability[];
  description: string;
  /**
   * 該頁的 ticket 是否已完成。false 代表路由還不存在，
   * 導覽只顯示不可點的項目，避免把使用者送進 404。
   * 對應 ticket 完成時把這裡改成 true 即可。
   */
  available: boolean;
}

/** §7.1 的預設頁順序：家長 → 我的驗收任務（撰寫者與 reviewer 合併）。 */
export const REVIEW_SECTIONS: ReviewSection[] = [
  {
    key: 'family',
    label: '家內驗收清單',
    href: '/review/family',
    capability: 'family.submit',
    description: '確認本家要送驗的教案、註記缺交，並送出本輪驗收。',
    available: true,
  },
  {
    key: 'tasks',
    label: '我的驗收任務',
    href: '/review/tasks',
    capability: ['review.submit', 'plan.author'],
    description: '處理自己教案的回饋與修改版，以及被指派的驗收任務。',
    available: true,
  },
];

/** 這個身分能不能進這一區。 */
export function sectionGranted(section: ReviewSection, capabilities: Capability[] | undefined): boolean {
  const required = Array.isArray(section.capability) ? section.capability : [section.capability];
  return required.some((cap) => capabilities?.includes(cap));
}

export const ADMIN_SECTIONS: ReviewSection[] = [
  {
    key: 'review',
    label: '驗收管理',
    href: '/admin/review',
    capability: 'review.manage',
    description: '六家進度、驗收分配、結果與時程設定。',
    available: true,
  },
  {
    key: 'members',
    label: '成員管理',
    href: '/admin/members',
    capability: 'admin.enter',
    description: '期別成員、家別與角色設定。',
    available: true,
  },
  {
    key: 'plans',
    label: '教案管理',
    href: '/admin/plans',
    capability: 'admin.enter',
    description: '全團教案檢視與優良標記。',
    available: true,
  },
  {
    key: 'rubric',
    label: '驗收標準',
    href: '/admin/rubric',
    capability: 'rubric.manage',
    description: '初驗 / 總驗評分標準的檢視與編輯。',
    available: true,
  },
];
