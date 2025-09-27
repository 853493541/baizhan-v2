"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./components/CreateScheduleModal";
import styles from "./styles.module.css";
import StandardScheduleList from "./components/StandardScheduleList";
import BossScheduleList from "./components/BossScheduleList";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Group {
  status?: "not_started" | "started" | "finished";
}

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: Ability[];
  characterCount: number;
  groups?: Group[];
}

interface BossPlan {
  _id: string;
  server: string;
  groupSize?: number;
  boss?: string;
  createdAt: string;
}

/**
 * 🔹 Week helper: Chinese reset time (UTC+8 Monday 7:00 AM)
 * In California this corresponds to Sunday 4:00 PM (UTC-7).
 */
function getCnWeekCode(dateString: string): string {
  const date = new Date(dateString);

  // Convert to UTC+8
  const utc8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  // Get Thursday of this week (ISO logic anchor)
  const tmp = new Date(Date.UTC(utc8.getUTCFullYear(), utc8.getUTCMonth(), utc8.getUTCDate()));
  tmp.setUTCDate(utc8.getUTCDate() + 4 - (utc8.getUTCDay() || 7));

  // Year start in UTC+8
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${tmp.getUTCFullYear()}W${weekNo}`;
}

export default function PlaygroundPage() {
  const [showModal, setShowModal] = useState(false);
  const [schedules, setSchedules] = useState<StandardSchedule[]>([]);
  const [bossPlans, setBossPlans] = useState<BossPlan[]>([]);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchBossPlans();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules`
      );
      if (!res.ok) throw new Error("Failed to fetch schedules");
      setSchedules(await res.json());
    } catch (err) {
      console.error("❌ Error fetching schedules:", err);
    }
  };

  const fetchBossPlans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans`
      );
      if (!res.ok) throw new Error("Failed to fetch boss plans");
      const data = await res.json();
      const patched = data.map((bp: BossPlan) => ({
        ...bp,
        groupSize: bp.groupSize ?? 3,
        boss: bp.boss ?? "未选择",
      }));
      setBossPlans(patched);
    } catch (err) {
      console.error("❌ Error fetching boss plans:", err);
    }
  };

  // 🔹 Split schedules by current vs past week
  const currentWeek = getCnWeekCode(new Date().toISOString());
  const currentSchedules = schedules.filter(
    (s) => getCnWeekCode(s.createdAt) === currentWeek
  );
  const pastSchedules = schedules.filter(
    (s) => getCnWeekCode(s.createdAt) !== currentWeek
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>排表</h2>

      <div className={styles.buttonRow}>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          新建排表
        </button>
      </div>

      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={async (data, mode) => {
            setShowModal(false);

            if (!mode || mode === "standard") {
              try {
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  }
                );
                if (!res.ok) throw new Error("❌ Failed to create schedule");
                await res.json();
                fetchSchedules();
              } catch (err) {
                console.error("❌ Error creating schedule:", err);
              }
            }

            if (mode === "boss") {
              fetchBossPlans();
            }
          }}
        />
      )}

      {/* 本周排表 */}
      <h3 className={styles.sectionTitle}>
        本周排表 ({currentWeek})
      </h3>
      <StandardScheduleList schedules={currentSchedules} />

      {/* 历史排表 toggle */}
      <div className={styles.pastSection}>
        <button
          className={styles.showPastBtn}
          onClick={() => setShowPast((prev) => !prev)}
        >
          {showPast
            ? "收起历史排表 ▲"
            : `查看历史排表 (${pastSchedules.length}) ▼`}
        </button>

        {showPast && (
          <>
            <h3 className={styles.sectionTitle}>历史排表</h3>
            <StandardScheduleList schedules={pastSchedules} />
          </>
        )}
      </div>

      {/* <BossScheduleList bossPlans={bossPlans} /> */}
    </div>
  );
}
