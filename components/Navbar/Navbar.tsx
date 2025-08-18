"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import Image from "next/image";

const MENU = [
  { key: "search", label: "教案檢索", to: "/" },
  { key: "manage", label: "教案管理", to: "/manage" },
  { key: "resources", label: "學習資源", to: "/resources" },
  { key: "report", label: "錯誤回報", to: "/report" },
  { key: "notification", label: "訊息公告", to: "/notification" }, // ← 用文字
];

export default function Navbar() {
  const [hasNotification] = useState(true); // 假資料：有公告就顯示小圓點
  const pathname = usePathname();
  const router = useRouter();

  const [elevated, setElevated] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);

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
          {MENU.map((item) => {
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

          {/* 使用者圖示 */}
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
        </div>
      </div>
    </header>
  );
}
