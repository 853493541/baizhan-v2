"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./CreateScheduleModal";
import CreateBossPlanModal from "./CreateBossPlanModal";
import Link from "next/link";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Character {
  _id: string;
  name: string;
  account: string;
  role: string;
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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBossPlanModal, setShowBossPlanModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bossPlans, setBossPlans] = useState<BossPlan[]>([]);

  useEffect(() => {
    fetchSchedules();
    fetchBossPlans();
  }, []);

  // Inline fetch for schedules
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

  // Inline fetch for boss plans
  const fetchBossPlans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans`
      );
      if (!res.ok) throw new Error("Failed to fetch boss plans");
      const data = await res.json();

      // ✅ Patch: ensure groupSize & boss exist
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
        <button
          className={styles.createBtn}
          onClick={() => setShowScheduleModal(true)}
        >
          新建排表
        </button>
        <button
          className={styles.createBtn}
          onClick={() => setShowBossPlanModal(true)}
        >
          新建 Boss Plan
        </button>
      </div>

      {/* Schedule modal */}
      {showScheduleModal && (
        <CreateScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onConfirm={() => {
            setShowScheduleModal(false);
            fetchSchedules();
          }}
        />
      )}

      {/* Boss Plan modal */}
      {showBossPlanModal && (
        <CreateBossPlanModal
          onClose={() => setShowBossPlanModal(false)}
          onCreated={() => {
            setShowBossPlanModal(false);
            fetchBossPlans();
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
            <Link key={s._id} href={`/playground/${s._id}`} className={styles.card}>
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
      <h3 className={styles.subtitle}>已有 Boss Plans</h3>
      {bossPlans.length === 0 ? (
        <p className={styles.empty}>暂无 Boss Plan</p>
      ) : (
        <div className={styles.cardGrid}>
          {bossPlans.map((bp) => (
            <Link
              key={bp._id}
              href={`/playground/boss-plans/${bp._id}`}
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
