"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./components/CreateScheduleModal";
import StandardScheduleList from "./components/StandardScheduleList";
import styles from "./styles.module.css";
import { getCurrentGameWeek } from "@/utils/weekUtils";

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
  const [currentSchedules, setCurrentSchedules] = useState<StandardSchedule[]>([]);
  const [pastSchedules, setPastSchedules] = useState<StandardSchedule[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false); // ✅ separate loader for past

  const currentWeek = getCurrentGameWeek();

  // ✅ Fetch only current week initially
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/summary?week=${currentWeek}`
        );
        const data = res.ok ? await res.json() : [];
        setCurrentSchedules(data);
      } catch (err) {
        console.error("❌ Error fetching current schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrent();
  }, [currentWeek]);

  // ✅ Lazy-load past schedules when user expands section
  const handleTogglePast = async () => {
    if (!showPast && pastSchedules.length === 0) {
      try {
        setLoadingPast(true);
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/summary?before=${currentWeek}`
        );
        const data = res.ok ? await res.json() : [];
        setPastSchedules(data);
      } catch (err) {
        console.error("❌ Error fetching past schedules:", err);
      } finally {
        setLoadingPast(false);
      }
    }

    // Toggle section regardless of fetch
    setShowPast((prev) => !prev);
  };

  const handleCreateSchedule = async (data: any) => {
    setShowModal(false);
    try {
      const res = await fetch(`${API_BASE}/api/standard-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("❌ Failed to create schedule");
      const newSchedule = await res.json();
      setCurrentSchedules((prev) => [newSchedule, ...prev]);
    } catch (err) {
      console.error("❌ Error creating schedule:", err);
    }
  };

  if (loading) return <p className={styles.loading}>加载中...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>排表</h2>

      {/* New schedule button */}
      <div className={styles.buttonRow}>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          新建排表
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={handleCreateSchedule}
        />
      )}

      {/* 本周排表 */}
      <h3 className={styles.sectionTitle}>本周排表 ({currentWeek})</h3>
      {currentSchedules.length > 0 ? (
        <StandardScheduleList
          schedules={currentSchedules}
          setSchedules={setCurrentSchedules}
        />
      ) : (
        <p className={styles.empty}>暂无本周排表</p>
      )}

      {/* 历史排表 toggle */}
      <div className={styles.pastSection}>
        <button
          className={styles.showPastBtn}
          onClick={handleTogglePast}
          disabled={loadingPast}
        >
          {loadingPast
            ? "加载中..."
            : showPast
            ? "收起历史排表 ▲"
            : `查看历史排表 ▼`}
        </button>

        {showPast && (
          <>
            <h3 className={styles.sectionTitle}>历史排表</h3>
            {loadingPast ? (
              <p className={styles.loading}>加载中...</p>
            ) : pastSchedules.length > 0 ? (
              <StandardScheduleList
                schedules={pastSchedules}
                setSchedules={setPastSchedules}
              />
            ) : (
              <p className={styles.empty}>暂无历史排表</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
