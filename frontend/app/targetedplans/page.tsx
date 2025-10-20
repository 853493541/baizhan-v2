"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./components/CreateScheduleModal";
import StandardScheduleList from "./components/StandardScheduleList";
import styles from "./styles.module.css";
import { getCurrentGameWeek } from "@/utils/weekUtils";

interface Group {
  status?: "not_started" | "started" | "finished";
}

interface TargetedPlan {
  _id: string;
  name: string;
  server: string;
  targetedBoss: string;
  createdAt: string;
  characterCount: number;
  groups?: Group[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function TargetedPlansPage() {
  const [showModal, setShowModal] = useState(false);
  const [currentPlans, setCurrentPlans] = useState<TargetedPlan[]>([]);
  const [pastPlans, setPastPlans] = useState<TargetedPlan[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);

  const currentWeek = getCurrentGameWeek();

  // ✅ Fetch current plans
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/targeted-plans`);
        const data = res.ok ? await res.json() : [];
        setCurrentPlans(data);
      } catch (err) {
        console.error("❌ Error fetching current targeted plans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrent();
  }, [currentWeek]);

  // ✅ Lazy-load past plans (optional for now)
  const handleTogglePast = async () => {
    if (!showPast && pastPlans.length === 0) {
      try {
        setLoadingPast(true);
        const res = await fetch(`${API_BASE}/api/targeted-plans`);
        const data = res.ok ? await res.json() : [];
        setPastPlans(data);
      } catch (err) {
        console.error("❌ Error fetching past targeted plans:", err);
      } finally {
        setLoadingPast(false);
      }
    }
    setShowPast((prev) => !prev);
  };

  const handleCreatePlan = async (data: any) => {
    setShowModal(false);
    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("❌ Failed to create targeted plan");
      const newPlan = await res.json();
      setCurrentPlans((prev) => [newPlan, ...prev]);
    } catch (err) {
      console.error("❌ Error creating targeted plan:", err);
    }
  };

  if (loading) return <p className={styles.loading}>加载中...</p>;

  const anyLocked = currentPlans.some((s) =>
    s.groups?.some((g) => g.status !== "not_started")
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>单体计划</h2>

      {/* ➕ New Plan */}
      <div className={styles.buttonRow}>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          新建单体计划
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={handleCreatePlan}
        />
      )}

      {/* 当前计划 */}
      <h3 className={styles.sectionTitle}>当前单体计划 ({currentWeek})</h3>
      {currentPlans.length > 0 ? (
        <StandardScheduleList
          schedules={currentPlans}
          setSchedules={setCurrentPlans}
          disabled={anyLocked}
        />
      ) : (
        <p className={styles.empty}>暂无当前单体计划</p>
      )}

      {/* 历史计划 */}
      <div className={styles.pastSection}>
        <button
          className={styles.showPastBtn}
          onClick={handleTogglePast}
          disabled={loadingPast}
        >
          {loadingPast
            ? "加载中..."
            : showPast
            ? "收起历史计划 ▲"
            : `查看历史计划 ▼`}
        </button>

        {showPast && (
          <>
            <h3 className={styles.sectionTitle}>历史单体计划</h3>
            {loadingPast ? (
              <p className={styles.loading}>加载中...</p>
            ) : pastPlans.length > 0 ? (
              <StandardScheduleList
                schedules={pastPlans}
                setSchedules={setPastPlans}
              />
            ) : (
              <p className={styles.empty}>暂无历史单体计划</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
