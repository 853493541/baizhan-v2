"use client";

import React, { useState, useEffect } from "react";

/* =======================
   Components
======================= */
import CreateScheduleModal from "./components/CreateScheduleModal";
import StandardScheduleList from "./components/StandardScheduleList";
import WeeklyMap from "@/app/map/WeeklyMap";

/* =======================
   Styles & Utils
======================= */
import styles from "./styles.module.css";
import { getCurrentGameWeek } from "@/utils/weekUtils";

/* =======================
   Types
======================= */
interface Group {
  status?: "not_started" | "started" | "finished";
}

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel: number;
  createdAt: string;
  characterCount: number;
  groups?: Group[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function PlaygroundPage() {
  const [showModal, setShowModal] = useState(false);
  const [currentSchedules, setCurrentSchedules] =
    useState<StandardSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWeek = getCurrentGameWeek();

  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/summary?week=${currentWeek}`
        );
        const data = res.ok ? await res.json() : [];
        setCurrentSchedules(data);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrent();
  }, [currentWeek]);

  const handleCreateSchedule = async (data: any) => {
    setShowModal(false);
    try {
      const res = await fetch(`${API_BASE}/api/standard-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Create failed");

      const newSchedule = await res.json();
      setCurrentSchedules((prev) => [newSchedule, ...prev]);
    } catch {}
  };

  if (loading) {
    return <p className={styles.loading}>加载中...</p>;
  }

  const anyLocked = currentSchedules.some((s) =>
    s.groups?.some((g) => g.status !== "not_started")
  );

  return (
    <div className={styles.container}>
      {/* =======================
         Page Header (Top Section)
      ======================= */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>本周排表</h1>
      </div>

      {/* =======================
         Weekly Map (Middle Section)
      ======================= */}
      <section className={styles.mapSection}>
        <WeeklyMap />
      </section>

      {/* =======================
         Schedule Section (Bottom)
      ======================= */}
      <div className={styles.scheduleSection}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>排表</h2>

          <button
            className={styles.createBtn}
            onClick={() => setShowModal(true)}
          >
            新建排表
          </button>
        </div>

        {showModal && (
          <CreateScheduleModal
            onClose={() => setShowModal(false)}
            onConfirm={handleCreateSchedule}
          />
        )}

        {currentSchedules.length > 0 ? (
          <StandardScheduleList
            schedules={currentSchedules}
            setSchedules={setCurrentSchedules}
            disabled={anyLocked}
          />
        ) : (
          <p className={styles.empty}>暂无本周排表</p>
        )}
      </div>
    </div>
  );
}
