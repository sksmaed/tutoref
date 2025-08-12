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
];

export default function Navbar() {
  const [hasNotification] = useState(true); // 模擬通知狀態（未來可接 API）
  const pathname = usePathname();
  const router = useRouter();

  const [elevated, setElevated] = useState(false);

  const [isBellHovered, setIsBellHovered] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bellIconSrc = mounted
    ? hasNotification
      ? "/icon/notification-on.png"
      : isBellHovered
      ? "/icon/notification-off-hover.png"
      : "/icon/notification-off.png"
    : "/icon/notification-off.png";

  const userIconSrc = mounted
    ? isUserHovered
      ? "/icon/user-hover.png"
      : "/icon/user.png"
    : "/icon/user.png";


  return (
    <header className={`${styles.header} ${elevated ? styles.elevated : ""}`}>
      <div className={styles.container}>
        {/* 左側 LOGO */}
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/logo.png"
            alt="Tutoref 教案檢索系統"
            width={100}
            height={40}
            priority
          />
        </Link>

        {/* 右側 Menu + Icons */}
        <div className={styles.menuGroup}>
          {MENU.map((item) => (
            <Link
              key={item.key}
              href={item.to}
              className={styles.menuItem}
            >
              {item.label}
            </Link>
          ))}

          {/* 通知圖示（hover + 有通知） */}
          <div
            className={styles.iconWrap}
            onMouseEnter={() => setIsBellHovered(true)}
            onMouseLeave={() => setIsBellHovered(false)}
            onClick={() => router.push("/notification")}
            style={{ cursor: "pointer" }}
          >
            <Image
              src={bellIconSrc}
              alt="通知"
              width={20}
              height={20}
            />
          </div>

          {/* 使用者圖示（hover 切換） */}
          <div
            className={styles.iconWrap}
            onMouseEnter={() => setIsUserHovered(true)}
            onMouseLeave={() => setIsUserHovered(false)}
            onClick={() => router.push("/user")}
            style={{ cursor: "pointer" }}
          >
            <Image
              src={userIconSrc}
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
