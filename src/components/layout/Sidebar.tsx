'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { triggerHomeReset } from '@/lib/home-reset';
import {
  EXTERNAL_LINKS,
  isItemActive,
  resolveHref,
  visibleGroups,
} from './nav-config';
import { useNavContext } from './useNavContext';
import { displayName } from './user-display';

interface SidebarProps {
  /** 手機版是否展開。桌機版永遠顯示。 */
  mobileOpen: boolean;
  onNavigate: () => void;
}

/** 全站側欄（v13 `.sidebar`）：桌機為浮動卡片，手機為覆蓋層。 */
export default function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const ctx = useNavContext();
  const groups = visibleGroups(ctx);

  return (
    <aside
      className={`${mobileOpen ? 'flex' : 'hidden'} fixed bottom-2.5 left-2.5 right-2.5 top-16 z-[45] flex-col overflow-hidden rounded-[10px] bg-white px-4 py-[18px] shadow-[0_5px_16px_rgba(0,0,0,0.08)] md:bottom-5 md:left-5 md:right-auto md:top-5 md:z-30 md:flex md:w-[206px]`}
      aria-label="主選單"
    >
      <Link
        href="/"
        onClick={() => {
          triggerHomeReset();
          onNavigate();
        }}
        className="mb-[10px] inline-flex border-b border-black-100 px-2 pb-[18px]"
      >
        <Image src="/logo.png" alt="Tutoref 教案檢索系統" width={100} height={40} priority />
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto pr-[2px]">
        {groups.map((group) => (
          <div key={group.key}>
            {group.label && (
              <p className="px-2 pb-[5px] pt-[13px] font-['Noto_Sans_TC'] text-[12px] text-black-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const href = resolveHref(item, ctx);
              const active = isItemActive(item, ctx, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={href}
                  onClick={() => {
                    if (href === '/') triggerHomeReset();
                    onNavigate();
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`my-[2px] flex items-center gap-2 rounded-[7px] px-[9px] py-[9px] font-['Noto_Sans_TC'] text-[15px] font-medium text-black-900 ${
                    active ? 'bg-primary-100' : 'hover:bg-primary-100/60'
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={active ? 'text-primary-900' : 'text-black-500'}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-3 flex gap-3 px-2 pb-2">
        {EXTERNAL_LINKS.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-['Noto_Sans_TC'] text-[12px] text-black-400 hover:text-primary-900"
          >
            {link.label}
          </a>
        ))}
      </div>

      {!ctx.loading && (
        <div className="flex items-center gap-[10px] border-t border-black-100 px-2 pt-[15px]">
          {ctx.authenticated && user ? (
            <>
              <div className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-black-200 font-['Noto_Sans_TC'] text-[13px] font-bold text-black-700">
                {displayName(user).slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-['Noto_Sans_TC'] text-[12px] font-bold text-black-900">
                  {displayName(user)}
                </p>
                <p className="truncate font-['Noto_Sans_TC'] text-[10px] text-black-400">
                  {user.email}
                </p>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onNavigate}
              className="w-full rounded-lg border border-primary-900 py-2 text-center font-['Noto_Sans_TC'] text-[14px] text-primary-900 hover:bg-primary-100"
            >
              登入 / 註冊
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
