import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Search,
  Upload,
  Users,
} from 'lucide-react';
import type { Capability } from '@/features/review-shared/types';

/**
 * 側欄導覽的唯一設定（v13 `renderSidebar()`）。
 *
 * 能不能看到某一項只看 capabilities（後端算好，前端只做 includes），
 * 這只是不畫出用不到的入口，真正的擋在後端。
 */

export interface NavContext {
  authenticated: boolean;
  capabilities: Capability[];
}

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  /** 可依身分決定連結位置。 */
  href: string | ((ctx: NavContext) => string);
  /** 判斷作用中的路徑前綴（或正規式）；預設用 href。`/` 只做完全比對。 */
  match?: (string | RegExp)[];
  visible?: (ctx: NavContext) => boolean;
}

export interface NavGroup {
  key: string;
  /** 沒有 label 的分組直接列出項目。 */
  label?: string;
  items: NavItem[];
}

const has = (ctx: NavContext, ...caps: Capability[]) =>
  caps.some((cap) => ctx.capabilities.includes(cap));
const loggedIn = (ctx: NavContext) => ctx.authenticated;

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'main',
    items: [
      { key: 'search', label: '教案檢索', icon: Search, href: '/' },
      { key: 'resources', label: '學習資源', icon: BookOpen, href: '/package' },
      {
        key: 'announcement',
        label: '訊息公告',
        icon: Megaphone,
        href: '/announcement',
        visible: loggedIn,
      },
    ],
  },
  {
    key: 'mine',
    label: '我的教案',
    items: [
      {
        key: 'plans-mine',
        label: '已上傳教案',
        icon: Upload,
        href: '/plans/mine',
        match: ['/plans/mine', /^\/plans\/[^/]+\/edit/, '/manage', '/upload'],
        visible: loggedIn,
      },
      {
        key: 'plans-likes',
        label: '已收藏教案',
        icon: Heart,
        href: '/plans/likes',
        visible: loggedIn,
      },
    ],
  },
  {
    key: 'review',
    label: '教案驗收',
    items: [
      {
        key: 'review-family',
        label: '家內教案',
        icon: Home,
        href: '/review/family',
        visible: (ctx) => has(ctx, 'family.submit'),
      },
      {
        key: 'review-tasks',
        label: '我的驗收任務',
        icon: ClipboardCheck,
        // TODO(M7)：本期教案併入 /review/tasks 前，只有撰寫者身分的人要導到 /review/my-plans
        href: (ctx) => (has(ctx, 'review.submit') ? '/review/tasks' : '/review/my-plans'),
        match: ['/review/tasks', '/review/my-plans'],
        visible: (ctx) => has(ctx, 'plan.author', 'review.submit'),
      },
      {
        key: 'admin-review',
        label: '本期驗收管理',
        icon: LayoutDashboard,
        href: '/admin/review',
        visible: (ctx) => has(ctx, 'review.manage'),
      },
      // TODO(M5)：公告撰寫器併入 /announcement 後移除這一項
      {
        key: 'admin-announcements',
        label: '驗收公告',
        icon: Megaphone,
        href: '/admin/announcements',
        visible: (ctx) => has(ctx, 'announcement.publish'),
      },
    ],
  },
  {
    key: 'admin',
    label: '教案組管理',
    items: [
      {
        key: 'admin-members',
        label: '成員管理',
        icon: Users,
        href: '/admin/members',
        visible: (ctx) => has(ctx, 'admin.enter'),
      },
      {
        key: 'admin-plans',
        label: '教案管理',
        icon: FileText,
        href: '/admin/plans',
        visible: (ctx) => has(ctx, 'admin.enter'),
      },
      {
        key: 'admin-rubric',
        label: '驗收標準',
        icon: ListChecks,
        href: '/admin/rubric',
        visible: (ctx) => has(ctx, 'rubric.manage'),
      },
    ],
  },
];

export const EXTERNAL_LINKS = [
  {
    key: 'manual',
    label: '使用手冊',
    href: 'https://lyrical-coaster-81e.notion.site/Tutoref-276e617dd21080c5b104f242f460a861',
  },
  {
    key: 'report',
    label: '錯誤回報',
    href: 'https://docs.google.com/forms/d/e/1FAIpQLSd-HbyD2VIXggG_6_YxHAxliwC4ZF0EtvfgZPy7WjwS-0RhLg/viewform?usp=sharing',
  },
];

export function resolveHref(item: NavItem, ctx: NavContext): string {
  return typeof item.href === 'function' ? item.href(ctx) : item.href;
}

export function isItemActive(item: NavItem, ctx: NavContext, pathname: string | null): boolean {
  if (!pathname) return false;
  const prefixes = item.match ?? [resolveHref(item, ctx)];
  return prefixes.some((prefix) => {
    if (prefix instanceof RegExp) return prefix.test(pathname);
    if (prefix === '/') return pathname === '/';
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

/** 依身分篩掉看不到的項目與空分組。 */
export function visibleGroups(ctx: NavContext): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.visible || item.visible(ctx)),
  })).filter((group) => group.items.length > 0);
}

/** 找出目前路徑對應的導覽項目（給頁面標題等用）。 */
export function findActiveItem(ctx: NavContext, pathname: string | null): NavItem | null {
  for (const group of visibleGroups(ctx)) {
    const hit = group.items.find((item) => isItemActive(item, ctx, pathname));
    if (hit) return hit;
  }
  return null;
}
