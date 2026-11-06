import type { UserResp } from '@/services/auth';

/** 後端角色代碼 → 顯示名稱。 */
export const ROLE_LABEL: Record<string, string> = {
  writer: '撰寫者',
  reviewer: '驗收者',
  parent: '家長',
  leader: '教案組長',
};

/** 顯示用姓名；沒有填姓名就用 email 的帳號部分。 */
export function displayName(user: UserResp | null | undefined): string {
  if (!user) return '';
  return user.name?.trim() || user.email.split('@')[0];
}
