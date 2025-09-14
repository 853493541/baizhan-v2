"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./CreateScheduleModal";
import Link from "next/link";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Schedule {
  _id: string;
  server: string;
  mode: "default" | "custom";
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
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bossPlans, setBossPlans] = useState<BossPlan[]>([]);

  useEffect(() => {
    fetchSchedules();
    fetchBossPlans();
  }, []);

  // Fetch all schedules
  const fetchSchedules = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`
      );
      if (!res.ok) throw new Error("Failed to fetch schedules");
      setSchedules(await res.json());
    } catch (err) {
      console.error("❌ Error fetching schedules:", err);
    }
  };

  // Fetch all boss plans
  const fetchBossPlans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans`
      );
      if (!res.ok) throw new Error("Failed to fetch boss plans");
      const data = await res.json();

      // Ensure groupSize & boss exist
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
      <h2 className={styles.title}>排表 Playground</h2>

      <div className={styles.buttonRow}>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          新建排表 / Boss 排表
        </button>
      </div>

      {/* Unified modal */}
      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={async (data, mode) => {
            setShowModal(false);

            if (mode === "default") {
              try {
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`,
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
              // Boss plan was created in modal → just refresh
              fetchBossPlans();
            }
          }}
        />
      )}

      {/* Existing schedules */}
      <h3 className={styles.subtitle}>已有排表</h3>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => (
            <Link key={s._id} href={`/playground/standard/${s._id}`} className={styles.card}>
              <h4 className={styles.cardTitle}>
                {new Date(s.createdAt).toLocaleString()}
              </h4>
              <p>服务器: {s.server}</p>
              <p>模式: {s.mode}</p>
              <p>冲突等级: {s.conflictLevel}</p>
              <p>角色数量: {s.characterCount}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Boss Plans */}
      <h3 className={styles.subtitle}>已有 Boss 排表</h3>
      {bossPlans.length === 0 ? (
        <p className={styles.empty}>暂无 Boss 排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {bossPlans.map((bp) => (
            <Link
              key={bp._id}
              href={`/playground/boss/${bp._id}`}
              className={styles.card}
            >
              <h4 className={styles.cardTitle}>
                {new Date(bp.createdAt).toLocaleString()}
              </h4>
              <p>服务器: {bp.server}</p>
              <p>分组人数: {bp.groupSize}</p>
              <p>Boss: {bp.boss}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
