"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";

interface OCRHeaderProps {
  characterId: string;
}

interface LatestUpdate {
  abilityName: string;
  level: number;
  updatedAt: string;
}

/* 🕒 Helper: format time ago */
function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay === 1) return "昨天";
  if (diffDay < 7) return `${diffDay}天前`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}周前`;
}

export default function OCRHeader({ characterId }: OCRHeaderProps) {
  const [latest, setLatest] = useState<LatestUpdate | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.endsWith("/api")
    ? process.env.NEXT_PUBLIC_API_URL
    : `${process.env.NEXT_PUBLIC_API_URL}/api`;

  useEffect(() => {
    const fetchLatest = async () => {
      if (!characterId) return;
      try {
        const res = await fetch(`${API_BASE}/characters/abilities/history/latest/${characterId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.abilityName) setLatest(data);
      } catch (err) {
        console.error("Failed to fetch latest ability update:", err);
      }
    };
    fetchLatest();
  }, [characterId, API_BASE]);

  const isOld =
    latest &&
    new Date().getTime() - new Date(latest.updatedAt).getTime() >
      14 * 24 * 60 * 60 * 1000;

  return (
    <div className={styles.ocrHeader}>
      <div className={styles.headerLeft}>
        <span className={styles.scanIcon}>🔍</span>
        <h2 className={styles.headerTitle}>OCR扫描</h2>
      </div>
      <div className={`${styles.headerRight} ${isOld ? styles.old : ""}`}>
        {latest
          ? `上次更新：${formatTimeAgo(latest.updatedAt)}`
          : "暂无更新记录"}
      </div>
    </div>
  );
}
