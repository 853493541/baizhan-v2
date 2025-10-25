"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./components/CreateScheduleModal";
import StandardScheduleList from "./components/StandardScheduleList";
import styles from "./styles.module.css";

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
const SERVERS = ["全服", "乾坤一掷", "唯我独尊", "梦江南"];

export default function TargetedPlansPage() {
  const [showModal, setShowModal] = useState(false);
  const [plans, setPlans] = useState<TargetedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all plans once
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/targeted-plans`);
        const data = res.ok ? await res.json() : [];
        setPlans(data);
      } catch (err) {
        console.error("❌ Error fetching targeted plans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // ✅ Handle new plan creation
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
      setPlans((prev) => [newPlan, ...prev]);
    } catch (err) {
      console.error("❌ Error creating targeted plan:", err);
    }
  };

  // ✅ Group plans by server
  const groupedPlans: Record<string, TargetedPlan[]> = {};
  for (const plan of plans) {
    const key = plan.server === "全服" ? "全服" : plan.server;
    if (!groupedPlans[key]) groupedPlans[key] = [];
    groupedPlans[key].push(plan);
  }

  if (loading) return <p className={styles.loading}>加载中...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>荡剑恩仇</h2>

      {/* ➕ New Plan Button */}
      <div className={styles.buttonRow}>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          新建对单排表
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={handleCreatePlan}
        />
      )}

      {/* 🗂️ Display plans by server */}
      {SERVERS.map((server) => {
        const plansForServer = groupedPlans[server] || [];
        if (plansForServer.length === 0) return null; // hide empty servers

        return (
          <div key={server} className={styles.serverSection}>
            <h3 className={styles.sectionTitle}>{server}</h3>
<StandardScheduleList
  schedules={plansForServer}
  setSchedules={(updater) =>
    setPlans((prev) => {
      const updatedList =
        typeof updater === "function" ? updater(groupedPlans[server] || []) : updater;
      const other = prev.filter((p) => p.server !== server);
      return [...other, ...updatedList];
    })
  }
/>
          </div>
        );
      })}
    </div>
  );
}
