"use client";

import { useState, useEffect } from "react";
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

  // 加入登入狀態
  const { loading, authenticated, user } = useAuth();

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
              // ✅ 已登入 → 顯示 user icon
              <div
                className={styles.iconWrap}
                onMouseEnter={() => setIsUserHovered(true)}
                onMouseLeave={() => setIsUserHovered(false)}
                onClick={() => router.push("/user")}
                style={{ cursor: "pointer" }}
              >
                <Image
                  src={isUserHovered ? "/icon/user-hover.png" : "/icon/user.png"}
                  alt="個人"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              // ✅ 未登入 → 顯示登入/註冊按鈕
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
                <span
                  className="
                    block
                    w-[68px] h-[21px]
                    text-[14px] leading-[21px]  /* = 150% of 14px，嚴格對齊 21px 高 */
                    font-normal font-['Noto_Sans_TC']
                    text-primary-900 text-center
                    whitespace-nowrap
                    tracking-[0]               /* letter-spacing: 0% */
                  "
                >
                  登入/註冊
                </span>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
