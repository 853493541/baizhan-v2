"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/navigation";

import GroupDetailModal from "./components/GroupDetailModal";
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

  // ✅ Fetch targeted plan
  const fetchPlan = async () => {
    if (!planId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans/${planId}`
      );
      if (!res.ok) throw new Error("Failed to fetch targeted plan");
      const data: TargetedPlan = await res.json();
      console.log("📥 Loaded targeted plan:", data);

      setPlan(data);
      setGroups(Array.isArray(data.groups) ? data.groups : []);

      // 🧠 Build checkedAbilities from boss name
      const bossName = data.targetedBoss;
      const bossEntry =
        (ChallengeBossDrops as any).bosses[bossName] || [];
      const commonPool = (ChallengeBossDrops as any).common || [];

      const abilityChecks: AbilityCheck[] = [];

      // 🟢 Boss-specific (always level 10)
      bossEntry.forEach((a: string) => {
        abilityChecks.push({ name: a, available: true, level: 10 });
      });

      // 🟡 Common pool (both level 9 and 10)
      commonPool.forEach((a: string) => {
        abilityChecks.push({ name: a, available: true, level: 9 });
        abilityChecks.push({ name: a, available: true, level: 10 });
      });

      console.groupCollapsed(
        `🧩 Built ability checklist for boss: ${bossName} (total ${abilityChecks.length})`
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

  const handleDelete = async () => {
    if (!planId) return;
    try {
      setDeleting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans/${planId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      router.push("/targetedplans");
    } catch (err) {
      console.error("❌ Failed to delete plan:", err);
      setDeleting(false);
    }
  };

  if (!planId) return <p className={styles.error}>无效的计划ID</p>;
  if (loading) return <p className={styles.loading}>加载中...</p>;
  if (!plan) return <p className={styles.error}>未找到计划</p>;

  const locked =
    groups?.some((g) => g.status === "started" || g.status === "finished") ??
    false;

  return (
    <div className={styles.container}>
      {/* === Section 1: Basic Info === */}
      <BasicInfoSection
        schedule={plan}
        onBack={() => router.push("/targetedplans")}
        onDelete={handleDelete}
        deleting={deleting}
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
        targetedBoss={plan.targetedBoss}  // ✅ connected to combined boss+common abilities
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
