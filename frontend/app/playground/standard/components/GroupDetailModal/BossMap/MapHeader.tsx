// BossMap/BossMapHeader.tsx
"use client";

import styles from "./styles.module.css";

export default function BossMapHeader(props: {
  title: string;
  countdown?: number;
  statusText: string;
  statusDotClass: string;
  onFinish: () => void;
  showFinish: boolean;
  leftSlot: React.ReactNode;
}) {
  const { title, countdown, statusText, statusDotClass, onFinish, showFinish, leftSlot } = props;

  return (
    <div className={styles.headerRow}>
      <div className={styles.leftSection}>
        <h3 className={styles.title}>{title}</h3>
        {leftSlot}
      </div>

      <div className={styles.rightControls}>
        {typeof countdown === "number" && (
          <span className={styles.countdownText}>（{countdown}秒后刷新）</span>
        )}

        <div className={styles.statusWrap} title={`当前状态：${statusText}`}>
          <span className={`${styles.statusDot} ${statusDotClass}`} />
          <span className={styles.statusText}>{statusText}</span>
        </div>

        {showFinish && (
          <button className={styles.actionBtn} onClick={onFinish}>
            结束
          </button>
        )}
      </div>
    </div>
  );
}
