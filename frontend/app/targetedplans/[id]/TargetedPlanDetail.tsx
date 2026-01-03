"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/navigation";

import BasicInfoSection from "./components/BasicInfo";
import MainSection from "./components/Main";
import ConfirmModal from "@/app/components/ConfirmModal";
import { toastError } from "@/app/components/toast/toast";

// 🧩 Import combined challenge boss drops
import ChallengeBossDrops from "@/app/data/Challenge_Boss_Drops.json";

interface AbilityCheck {
  name: string;
  available: boolean;
  level: number;
}

interface Group {
  index: number;
  characters: any[];
  status?: "not_started" | "started" | "finished";
  kills?: any[];
}

interface TargetedPlan {
  _id: string;
  planId: string;
  type: string;
  name: string;
  server: string;
  targetedBoss: string;
  createdAt: string;
  characterCount: number;
  characters: any[];
  groups: Group[];
}

interface Props {
  planId?: string;
}

export default function TargetedPlanDetail({ planId }: Props) {
  const [plan, setPlan] = useState<TargetedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [checkedAbilities, setCheckedAbilities] = useState<AbilityCheck[]>([]);
  const [deleting, setDeleting] = useState(false);

  /* ============================
     Confirm state (NEW)
  ============================ */
  const [confirmOpen, setConfirmOpen] = useState(false);

  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  /* =======================================================================
     🧠 Fetch targeted plan detail
  ======================================================================= */
  const fetchPlan = async () => {
    if (!planId) return;

    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans/${planId}`);
      if (!res.ok) throw new Error("Failed to fetch targeted plan");

      const data: TargetedPlan = await res.json();

      setPlan(data);
      setGroups(Array.isArray(data.groups) ? data.groups : []);

      /* ===== Build ability checklist ===== */
      const bossName = data.targetedBoss;
      const bossEntry = (ChallengeBossDrops as any).bosses[bossName] || [];
      const commonPool = (ChallengeBossDrops as any).common || [];

      const abilityChecks: AbilityCheck[] = [];

      bossEntry.forEach((a: string) => {
        abilityChecks.push({ name: a, available: true, level: 10 });
      });

      commonPool.forEach((a: string) => {
        abilityChecks.push({ name: a, available: true, level: 9 });
        abilityChecks.push({ name: a, available: true, level: 10 });
      });

      setCheckedAbilities(abilityChecks);
    } catch (err) {
      console.error("❌ Error fetching targeted plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planId) fetchPlan();
  }, [planId]);

  /* =======================================================================
     🗑️ Delete targeted plan (step 1)
  ======================================================================= */
  const handleDelete = () => {
    setConfirmOpen(true);
  };

  /* =======================================================================
     🗑️ Delete targeted plan (step 2)
  ======================================================================= */
  const confirmDelete = async () => {
    if (!planId) return;

    setConfirmOpen(false);
    setDeleting(true);

    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans/${planId}`, {
        method: "DELETE",
      });

      // ✅ tolerate 404 (already deleted)
      if (![200, 201, 204, 404].includes(res.status)) {
        throw new Error("Delete failed");
      }

      router.push("/targetedplans");
    } catch (err) {
      console.error("❌ Failed to delete plan:", err);
      toastError("删除失败，请稍后再试");
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
  };

  /* =======================================================================
     🧱 Rendering
  ======================================================================= */
  if (!planId) return <p className={styles.error}>无效的计划ID</p>;
  if (loading) return <p className={styles.loading}>加载中...</p>;
  if (!plan) return <p className={styles.error}>未找到计划</p>;

  const locked =
    groups?.some(
      (g) => g.status === "started" || g.status === "finished"
    ) ?? false;

  return (
    <>
      <div className={styles.container}>
        {/* === Section 1: Basic Info === */}
        <BasicInfoSection
          schedule={plan}
          onBack={() => router.push("/targetedplans")}
          onDelete={handleDelete}
          locked={locked}
        />

        {/* === Section 2: Main Groups === */}
        <MainSection
          schedule={plan}
          groups={groups}
          setGroups={setGroups}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          checkGroupQA={() => []}
          checkedAbilities={checkedAbilities}
          targetedBoss={plan.targetedBoss}
        />

        {/* === Group Modal === */}
        {activeIdx !== null && (
          <GroupDetailModal
            scheduleId={plan._id}
            groupIndex={activeIdx}
            group={groups[activeIdx]}
            checkedAbilities={checkedAbilities}
            conflictLevel={0}
            onClose={() => setActiveIdx(null)}
            onRefresh={fetchPlan}
          />
        )}
      </div>

      {/* ================= CONFIRM DELETE ================= */}
      {confirmOpen && (
        <ConfirmModal
          title="删除排表"
          message="确认删除这个排表？此操作不可撤销。"
          intent="danger"
          confirmText="删除"
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
