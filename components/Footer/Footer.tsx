// components/Footer/Footer.tsx
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        Copyright © 2025 Tutoref 製作團隊 版權所有
        <span className={styles.version}>v1.1.1</span>
      </div>
    </footer>
  );
}
