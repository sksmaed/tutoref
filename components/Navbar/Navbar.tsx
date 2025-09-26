'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./Navbar.module.css";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth"; // ⬅️ 新增
import { isCurrentlyInMaintenanceMode } from "@/lib/maintenance";
import { triggerHomeReset } from "@/lib/homeReset";

const REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd-HbyD2VIXggG_6_YxHAxliwC4ZF0EtvfgZPy7WjwS-0RhLg/viewform?usp=sharing";

const BASE_MENU = [
  { key: "search", label: "教案檢索", to: "/" },
  // { key: "resources", label: "學習資源", to: "/resources" },
  { key: "report", label: "錯誤回報", to: REPORT_URL, external: true },
  // { key: "notification", label: "訊息公告", to: "/notification" },
];

export default function Navbar() {
  
  const [hasNotification] = useState(true); 
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [elevated, setElevated] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const hideTimer = useRef<number | null>(null);

  // 加入登入狀態
  const { loading, authenticated, user, logout } = useAuth() as any;

  // 檢查維護模式
  useEffect(() => {
    setMaintenanceMode(isCurrentlyInMaintenanceMode());
  }, [searchParams]);

  const openMenu = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setIsUserHovered(true);
  };
  const scheduleClose = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIsUserHovered(false), 200); // 150~250ms 都可
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      } else {
        // TODO: 依你的登入機制清理 token/cookie
        // localStorage.removeItem('token')
      }
    } finally {
      router.replace('/login'); // 登出後導到登入頁（要改首頁也可）
    }
  };

  const menu = authenticated
  ? [
      BASE_MENU[0], // 教案檢索
      { key: "manage", label: "教案管理", to: "/manage" },
      ...BASE_MENU.slice(1), // 學習資源、錯誤回報、訊息公告
    ]
  : BASE_MENU;

  const handleHomeClick = useCallback(() => {
    triggerHomeReset();
  }, []);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${elevated ? styles.elevated : ""}`}>
      <div className={styles.container}>
        {/* 左側 LOGO */}
        <Link href="/" className={styles.logoLink} onClick={handleHomeClick}>
          <Image src="/logo.png" alt="Tutoref 教案檢索系統" width={100} height={40} priority />
        </Link>

        {/* 右側 Menu + User */}
        <div className={styles.menuGroup}>
          {menu.map((item) => {
            const isActive = pathname === item.to;
            const base = `${styles.menuItem} ${isActive ? styles.active : ""} ${maintenanceMode ? styles.disabled : ""}`;
            
            if (item.key === "notification") {
              return (
                <Link key={item.key} href={item.to} className={base}>
                  <span className={styles.noticeLabel}>
                    {item.label}
                    {hasNotification && (
                      <span
                        className={`${styles.noticeDot} bg-primary-900`}
                        aria-label="有新的公告"
                        title="有新的公告"
                      />
                    )}
                  </span>
                </Link>
              );
            }
            if (item.external) {
              return (
                <Link
                  key={item.key}
                  href={item.to}
                  className={base}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
          })}

          {/* 使用者區塊 */}
          {!loading && (
            authenticated ? (
              // ✅ 已登入：user icon 僅供 hover，不可點 (維護模式下禁用)
                <div
                  className={`
                    relative ml-[20px]
                    after:content-[''] after:absolute after:top-full after:left-0
                    after:w-[140px] after:h-[8px]  /* Hover-bridge：8px 的透明橋接 */
                    after:pointer-events-auto
                    ${maintenanceMode ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onMouseEnter={maintenanceMode ? undefined : openMenu}
                  onMouseLeave={maintenanceMode ? undefined : scheduleClose}
                  aria-haspopup="menu"
                  aria-expanded={maintenanceMode ? false : isUserHovered}
                  style={{ cursor: maintenanceMode ? "not-allowed" : "default" }}
                >
                <Image
                  src={!maintenanceMode && isUserHovered ? "/icons/user-hover.png" : "/icons/user.png"}
                  alt="使用者"
                  width={20}
                  height={20}
                  priority
                />

                {/* 下拉選單：外框 140×64、圓角 8、上下 padding 12、白底、陰影 (維護模式下不顯示) */}
                {!maintenanceMode && isUserHovered && (
                    <div
                      className="
                        absolute right-0 top-full mt-2
                        w-[140px] h-[64px]
                        rounded-[8px] bg-white
                        shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
                        py-[12px] z-50
                      "
                      onMouseEnter={openMenu}
                      onMouseLeave={scheduleClose}
                    >
                    {/* 單一 item：140×40、px20/py8、gap8；hover=Primary/100 */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        w-[140px] h-[40px]
                        px-[20px] py-[8px]
                        flex items-center gap-[8px]
                        rounded-[8px]
                        hover:bg-primary-100
                      "
                    >
                      <Image src="/icons/logout.png" alt="" width={20} height={20} /> {/* icons/logout */}
                      <span className="text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-normal tracking-[0] text-black-900">
                        登出
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ✅ 未登入 → 顯示登入/註冊按鈕 (維護模式下變成 span)
              maintenanceMode ? (
                <span
                  className="
                    w-[100px] h-[36px]
                    inline-flex items-center justify-center gap-[10px]
                    rounded-[4px]
                    px-[22px] py-[7px]
                    border border-gray-400
                    text-gray-400
                    ml-[20px]
                    cursor-not-allowed
                    opacity-50
                  "
                  aria-label="登入 / 註冊 (維護中)"
                >
                  <span className="block w-[68px] h-[21px] text-[14px] leading-[21px] font-normal font-['Noto_Sans_TC'] text-gray-400 text-center whitespace-nowrap tracking-[0]">
                    登入 / 註冊
                  </span>
                </span>
              ) : (
                <Link
                  href="/login"
                  className="
                    w-[100px] h-[36px]
                    inline-flex items-right justify-center gap-[10px]
                    rounded-[4px]
                    px-[22px] py-[7px]
                    border border-primary-900
                    text-primary-900
                    hover:bg-primary-100
                    ml-[20px]
                  "
                  aria-label="登入 / 註冊"
                >
                  <span className="block w-[68px] h-[21px] text-[14px] leading-[21px] font-normal font-['Noto_Sans_TC'] text-primary-900 text-center whitespace-nowrap tracking-[0]">
                    登入 / 註冊
                  </span>
                </Link>
              )
            )
          )}
        </div>
      </div>
    </header>
  );
}
