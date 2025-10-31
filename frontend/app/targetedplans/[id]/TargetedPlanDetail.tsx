"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/navigation";

import BasicInfoSection from "./components/BasicInfo";
import MainSection from "./components/Main";

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
  const [deleting, setDeleting] = useState(false);
  const [checkedAbilities, setCheckedAbilities] = useState<AbilityCheck[]>([]);
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
      console.log("📥 Loaded targeted plan:", data);

      setPlan(data);
      setGroups(Array.isArray(data.groups) ? data.groups : []);

      // 🧩 Build checked abilities based on boss
      const bossName = data.targetedBoss;
      const bossEntry = (ChallengeBossDrops as any).bosses[bossName] || [];
      const commonPool = (ChallengeBossDrops as any).common || [];

      const abilityChecks: AbilityCheck[] = [];

      // Boss-specific (always level 10)
      bossEntry.forEach((a: string) => {
        abilityChecks.push({ name: a, available: true, level: 10 });
      });

      // Common pool (both levels 9 & 10)
      commonPool.forEach((a: string) => {
        abilityChecks.push({ name: a, available: true, level: 9 });
        abilityChecks.push({ name: a, available: true, level: 10 });
      });

      console.groupCollapsed(
        `🧩 Built ability checklist for boss: ${bossName} (${abilityChecks.length})`
      );
      abilityChecks.forEach((a, i) =>
        console.log(
          `${String(i + 1).padStart(2, "0")}. ${a.name} — Lv${a.level} (${a.available ? "✓" : "✗"})`
        )
      );
      console.groupEnd();

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
     🗑️ Delete targeted plan (404-tolerant)
  ======================================================================= */
  const handleDelete = async () => {
    if (!planId) return;
    if (!confirm("确定要删除这个排表吗？")) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/targeted-plans/${planId}`, {
        method: "DELETE",
      });

      // ✅ Ignore 404 (already deleted)
      if (res.status !== 200 && res.status !== 201 && res.status !== 204) {
        if (res.status !== 404) throw new Error("Delete failed");
      }

      console.log("✅ Targeted plan deleted:", planId);
      router.push("/targetedplans");
    } catch (err) {
      console.error("❌ Failed to delete plan:", err);
      alert("删除失败，请稍后再试");
      setDeleting(false);
    }
  };

  /* =======================================================================
     🧱 Rendering
  ======================================================================= */
  if (!planId) return <p className={styles.error}>无效的计划ID</p>;
  if (loading) return <p className={styles.loading}>加载中...</p>;
  if (!plan) return <p className={styles.error}>未找到计划</p>;

  const locked =
    groups?.some((g) => g.status === "started" || g.status === "finished") ?? false;

  return (
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
  );
}
