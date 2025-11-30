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
  const [loading, setLoading] = useState(true);

  const currentWeek = getCurrentGameWeek(); // e.g. "2025-W48"
  const weekNumber = currentWeek.split("-W")[1]; // "48"

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

  if (loading) return <p className={styles.loading}>加载中...</p>;

  const anyLocked = currentSchedules.some((s) =>
    s.groups?.some((g) => g.status !== "not_started")
  );

  return (
    <div className={styles.container}>

      {/* Title + Subtitle */}
      <div className={styles.headerBlock}>
        <h2 className={styles.title}>本周排表</h2>
        {/* <p className={styles.subtitle}>第{weekNumber}周</p> */}
      </div>

      {/* Create Button */}
      <div className={styles.buttonRow}>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          新建排表
        </button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={handleCreateSchedule}
        />
      )}

      {/* List */}
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
  );
}
