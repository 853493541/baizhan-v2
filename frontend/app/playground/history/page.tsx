"use client";

import React, { useEffect, useState } from "react";
import StandardScheduleList from "../components/StandardScheduleList";
import styles from "./styles.module.css";
import { getCurrentGameWeek } from "@/utils/weekUtils";

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel: number;
  createdAt: string;
  characterCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function HistoryPage() {
  const [pastSchedules, setPastSchedules] = useState<StandardSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWeek = getCurrentGameWeek();

  useEffect(() => {
    const fetchPast = async () => {
      try {
        setLoading(true);

        const before = encodeURIComponent(currentWeek);

        const res = await fetch(
          `${API_BASE}/api/standard-schedules/summary?before=${before}`
        );

        const data: StandardSchedule[] = res.ok ? await res.json() : [];

        /* ===============================
           ✅ ONLY FIX:
           sort by createdAt DESC
           (single source of truth)
        =============================== */
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        console.log(
          "[weekh] sorted by createdAt:",
          data.map((d) => d.createdAt)
        );

        setPastSchedules(data);
      } finally {
        setLoading(false);
      }
    };

    fetchPast();
  }, [currentWeek]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>历史排表</div>

      {loading ? (
        <p className={styles.loading}>加载中...</p>
      ) : pastSchedules.length > 0 ? (
        <StandardScheduleList
          schedules={pastSchedules}
          setSchedules={setPastSchedules}
        />
      ) : (
        <p className={styles.empty}>暂无历史排表</p>
      )}
    </div>
  );
}
