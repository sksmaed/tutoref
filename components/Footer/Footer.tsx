// components/Footer/Footer.tsx
"use client";

import { useEffect, useState } from "react";
import { getVersion } from "@/lib/api";
import { VersionResponse } from "@/types/api";
import styles from "./Footer.module.css";

export default function Footer() {
  const [version, setVersion] = useState<string>("loading...");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const versionData: VersionResponse = await getVersion();
        setVersion(versionData.version);
      } catch (error) {
        console.error("Failed to fetch version:", error);
        setVersion("v1.1.1"); // fallback version
      }
    };

    fetchVersion();
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        Copyright © 2025 Tutoref 製作團隊 版權所有
        <span className={styles.version}>v{version}</span>
      </div>
    </footer>
  );
}
