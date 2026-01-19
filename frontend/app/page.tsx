"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

/* =======================
   Components
======================= */
import StandardScheduleList from "@/app/playground/components/StandardScheduleList";

/* =======================
   Styles & Utils
======================= */
import styles from "./page.module.css";
import { getCurrentGameWeek } from "@/utils/weekUtils";

/* =======================
   Types (same as Playground)
======================= */
interface Group {
  status?: "not_started" | "started" | "finished";
}

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel?: number;
  createdAt: string;
  characterCount: number;
  groups?: Group[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function HomePage() {
  const [schedules, setSchedules] = useState<StandardSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWeek = getCurrentGameWeek();

  /* =======================
     SAME API CALL AS PLAYGROUND
  ======================= */
  useEffect(() => {
    const fetchCurrentWeekSchedules = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/summary?week=${currentWeek}`
        );
        const data = res.ok ? await res.json() : [];
        setSchedules(data);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentWeekSchedules();
  }, [currentWeek]);

  return (
    <div className={styles.container}>
      {/* ================= Header ================= */}
      <div className={styles.header}>
        <h1 className={styles.title}>百战</h1>
        <p className={styles.subtitle}>快速查看角色和排表</p>
      </div>

      {/* ================= Quick Access ================= */}
      <div className={styles.quickAccess}>
        <Link href="/characters" className={styles.card}>
          🧩 全部角色
        </Link>
        <Link href="/playground" className={styles.card}>
          📊 本周排表
        </Link>
        <Link href="/ranking" className={styles.card}>
          🏆 排行榜
        </Link>
        <Link href="/history" className={styles.card}>
          🕒 技能更新记录
        </Link>
      </div>

      {/* ================= Current Week Schedules ================= */}
      <section className={styles.weekSection}>
        <h2 className={styles.sectionTitle}>本周排表</h2>

        {loading ? (
          <p className={styles.muted}>加载中…</p>
        ) : schedules.length > 0 ? (
          <StandardScheduleList
            schedules={schedules}
            setSchedules={setSchedules}
          />
        ) : (
          <p className={styles.muted}>暂无本周排表</p>
        )}
      </section>

      {/* ================= Footer ================= */}
      <div className={styles.footer}>
        <p>版本 v2.20</p>
        <p>作者: 轻语@乾坤一掷</p>
      </div>
    </div>
  );
}
