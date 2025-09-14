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

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: Ability[];
  characterCount: number;
}

interface BossPlan {
  _id: string;
  server: string;
  groupSize?: number;
  boss?: string;
  createdAt: string;
}

export default function PlaygroundPage() {
  const [showModal, setShowModal] = useState(false);
  const [schedules, setSchedules] = useState<StandardSchedule[]>([]);
  const [bossPlans, setBossPlans] = useState<BossPlan[]>([]);

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
              // ✅ Standard schedule
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

      <StandardScheduleList schedules={schedules} />
      <BossScheduleList bossPlans={bossPlans} />
    </div>
  );
}
