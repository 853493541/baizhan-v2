"use client";

import Link from "next/link";
import styles from "./styles.module.css";
import { toastError } from "@/app/components/toast/toast";

export default function InfoCenterPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>数据中心</h1>

      <div className={styles.grid}>
        <IconLink href="/playground/history" icon="📊" label="过往排表" />

        <IconLink href="/map/history" icon="🗺" label="历史地图" />
        <IconLink href="/history" icon="🕓" label="技能更新记录" />
        <IconLink href="/stats/appearances" icon="📈" label="上班统计" />

        {/* 🚫 Disabled */}
        <DisabledCard
          icon="🎯"
          label="荡剑恩仇"
          onClick={() =>
            toastError("本赛季荡剑恩仇已关闭")
          }
        />
      </div>
    </div>
  );
}

/* ===============================
   Components
================================ */

function IconLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.label}>{label}</div>
    </Link>
  );
}

function DisabledCard({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`${styles.card} ${styles.disabled}`}
      onClick={onClick}
      role="button"
      aria-disabled
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
