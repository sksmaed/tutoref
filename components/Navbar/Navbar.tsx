"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth"; // ⬅️ 新增

const BASE_MENU = [
  { key: "search", label: "教案檢索", to: "/" },
  { key: "resources", label: "學習資源", to: "/resources" },
  { key: "report", label: "錯誤回報", to: "/report" },
  { key: "notification", label: "訊息公告", to: "/notification" },
];

export default function Navbar() {
  
  const [hasNotification] = useState(true); 
  const pathname = usePathname();
  const router = useRouter();

  const [elevated, setElevated] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const hideTimer = useRef<number | null>(null);

  // 加入登入狀態
  const { loading, authenticated, user, logout } = useAuth() as any;

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

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${elevated ? styles.elevated : ""}`}>
      <div className={styles.container}>
        {/* 左側 LOGO */}
        <Link href="/" className={styles.logoLink}>
          <Image src="/logo.png" alt="Tutoref 教案檢索系統" width={100} height={40} priority />
        </Link>

        {/* 右側 Menu + User */}
        <div className={styles.menuGroup}>
          {menu.map((item) => {
            const isActive = pathname === item.to;
            const base = `${styles.menuItem} ${isActive ? styles.active : ""}`;
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
            return (
              <Link key={item.key} href={item.to} className={base}>
                {item.label}
              </Link>
            );
          })}

          {/* 使用者區塊 */}
          {!loading && (
            authenticated ? (
              // ✅ 已登入：user icon 僅供 hover，不可點
                <div
                  className="
                    relative ml-[20px]
                    after:content-[''] after:absolute after:top-full after:left-0
                    after:w-[140px] after:h-[8px]  /* Hover-bridge：8px 的透明橋接 */
                    after:pointer-events-auto
                  "
                  onMouseEnter={openMenu}
                  onMouseLeave={scheduleClose}
                  aria-haspopup="menu"
                  aria-expanded={isUserHovered}
                  style={{ cursor: "default" }}
                >
                <Image
                  src={isUserHovered ? "/icons/user-hover.png" : "/icons/user.png"}
                  alt="使用者"
                  width={20}
                  height={20}
                  priority
                />

                {/* 下拉選單：外框 140×64、圓角 8、上下 padding 12、白底、陰影 */}
                {isUserHovered && (
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
              // ✅ 未登入 → 顯示登入/註冊按鈕（你原本那段保持不變）
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
          )}
        </div>
      </div>
    </header>
  );
}
