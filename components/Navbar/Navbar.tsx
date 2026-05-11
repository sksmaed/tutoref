'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./Navbar.module.css";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { isCurrentlyInMaintenanceMode } from "@/lib/maintenance";
import { triggerHomeReset } from "@/lib/homeReset";

const REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd-HbyD2VIXggG_6_YxHAxliwC4ZF0EtvfgZPy7WjwS-0RhLg/viewform?usp=sharing";
const MANUAL_URL = "https://lyrical-coaster-81e.notion.site/Tutoref-276e617dd21080c5b104f242f460a861";

const BASE_MENU = [
  { key: "search", label: "教案檢索", to: "/" },
  { key: "resources", label: "學習資源", to: "/package" },
  { key: "manual", label: "使用手冊", to: MANUAL_URL, external: true },
  { key: "report", label: "錯誤回報", to: REPORT_URL, external: true },
];

export default function Navbar() {
  const [hasNotification] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [elevated, setElevated] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const { loading, authenticated, logout } = useAuth() as any;

  useEffect(() => {
    setMaintenanceMode(isCurrentlyInMaintenanceMode());
  }, [searchParams]);

  useEffect(() => {
    if (!loading) setIsUserHovered(false);
  }, [loading]);

  // 切換路由時關閉手機選單
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const openMenu = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setIsUserHovered(true);
  };
  const scheduleClose = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIsUserHovered(false), 200);
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') await logout();
    } finally {
      router.replace('/login');
    }
  };

  const menu = authenticated
    ? [BASE_MENU[0], { key: "manage", label: "教案管理", to: "/manage" }, ...BASE_MENU.slice(1)]
    : BASE_MENU;

  const handleHomeClick = useCallback(() => {
    triggerHomeReset();
  }, []);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const renderMenuItems = (mobile = false) =>
    menu.map((item) => {
      const base = mobile
        ? [styles.mobileMenuItem, maintenanceMode && styles.disabled].filter(Boolean).join(' ')
        : [styles.menuItem, maintenanceMode && styles.disabled].filter(Boolean).join(' ');

      if (item.external) {
        return (
          <Link key={item.key} href={item.to} className={base} target="_blank" rel="noopener noreferrer">
            {item.label}
          </Link>
        );
      }
      return (
        <Link
          key={item.key}
          href={item.to}
          className={base}
          onClick={item.to === "/" ? handleHomeClick : undefined}
        >
          {item.label}
        </Link>
      );
    });

  const loginButton = maintenanceMode ? (
    <span className={styles.loginBtnDisabled} aria-label="登入 / 註冊 (維護中)">
      <span className="whitespace-nowrap text-[14px] font-['Noto_Sans_TC'] text-gray-400">登入 / 註冊</span>
    </span>
  ) : (
    <Link href="/login" className={styles.loginBtn} aria-label="登入 / 註冊">
      <span className="whitespace-nowrap text-[14px] font-['Noto_Sans_TC'] text-primary-900">登入 / 註冊</span>
    </Link>
  );

  return (
    <header className={`${styles.header} ${elevated ? styles.elevated : ""}`}>
      {/* Desktop / Tablet bar */}
      <div className={styles.container}>
        {/* 漢堡按鈕（xl 以下左側） */}
        <button
          type="button"
          className="sm:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8 cursor-pointer"
          onClick={() => setMobileOpen(true)}
          aria-label="開啟選單"
        >
          <span className="block w-6 h-[2px] bg-black-900" />
          <span className="block w-6 h-[2px] bg-black-900" />
          <span className="block w-6 h-[2px] bg-black-900" />
        </button>

        {/* Logo（手機置中、桌面靠左） */}
        <Link href="/" className="sm:mr-auto absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 inline-flex items-center" onClick={handleHomeClick}>
          <Image src="/logo.png" alt="Tutoref 教案檢索系統" width={100} height={40} priority />
        </Link>

        {/* Desktop menu（xl 以上才顯示） */}
        <div className="hidden sm:flex">
        <div className={styles.menuGroup}>
          {renderMenuItems()}

          {/* 使用者區塊 */}
          {!loading && (
            authenticated ? (
              <div
                className={`relative ml-5 ${maintenanceMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onMouseEnter={maintenanceMode ? undefined : openMenu}
                onMouseLeave={maintenanceMode ? undefined : scheduleClose}
                aria-haspopup="menu"
                aria-expanded={maintenanceMode ? false : isUserHovered}
              >
                <img
                  src={!maintenanceMode && isUserHovered ? "/icons/user-hover.png" : "/icons/user.svg"}
                  alt="使用者"
                  width={20}
                  height={20}
                />
                {!maintenanceMode && isUserHovered && (
                  <div
                    className="absolute right-0 top-full mt-2 w-[140px] rounded-[8px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] py-[12px] z-50"
                    onMouseEnter={openMenu}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-[20px] py-[8px] flex items-center gap-[8px] rounded-[8px] hover:bg-primary-100 cursor-pointer"
                    >
                      <img src="/icons/logout.svg" alt="" width={20} height={20} />
                      <span className="text-[16px] font-['Noto_Sans_TC'] text-black-900">登出</span>
                    </button>
                  </div>
                )}
              </div>
            ) : loginButton
          )}
        </div>
        </div>

      </div>

      {/* 手機 Drawer + 遮罩 */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          {/* 左側 Drawer */}
          <div className="w-[72%] max-w-[300px] h-full bg-white flex flex-col shadow-[4px_0_16px_rgba(0,0,0,0.12)]">
            {/* 關閉按鈕 */}
            <div className="h-[60px] flex items-center px-6">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="關閉選單"
                className="text-[22px] text-black-900 leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 選單項目 */}
            <nav className="flex flex-col px-4 flex-1">
              {renderMenuItems(true)}
            </nav>

            {/* 登入 / 登出（底部） */}
            {!loading && (
              <div className="px-4 pb-8 border-t border-gray-100 pt-4">
                {authenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 text-[16px] font-['Noto_Sans_TC'] text-black-900 hover:bg-primary-50 rounded-lg w-full text-left"
                  >
                    <img src="/icons/logout.svg" alt="" width={18} height={18} />
                    登出
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block text-center py-3 text-[16px] font-['Noto_Sans_TC'] text-black-900 hover:text-primary-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    登入 / 註冊
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 右側遮罩 */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </header>
  );
}
