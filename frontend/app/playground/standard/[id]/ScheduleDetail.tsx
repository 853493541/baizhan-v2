"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runSolver, GroupResult, Character, AbilityCheck } from "@/utils/solver";
import GroupDetailModal from "../components/GroupDetailModal";

import BasicInfoSection from "../components/BasicInfo";
import AbilityCheckingSection from "../components/AbilityChecking";
import MainSection from "../components/Main";
import { useRouter } from "next/navigation";
import AdvancedGroups from "../components/AdvancedGroups";  
// ✅ Extended group type to match DB
interface ExtendedGroup extends GroupResult {
  index: number;
  status?: "not_started" | "started" | "finished";
  kills?: any[];
}

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: AbilityCheck[];
  characterCount: number;
  characters: Character[];
  groups?: ExtendedGroup[];
}

interface Props {
  scheduleId: string;
}

// ✅ QA checker (kept here for now)
function checkGroupQA(
  group: GroupResult,
  conflictLevel: number,
  checkedAbilities: AbilityCheck[]
): string[] {
  const warnings: string[] = [];

  if (!group.characters.some((c) => c.role === "Healer")) {
    warnings.push("缺少治疗");
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of group.characters) {
    if (seen.has(c.account)) dups.add(c.account);
    seen.add(c.account);
  }
  if (dups.size > 0) {
    warnings.push(`重复账号: ${Array.from(dups).join("、")}`);
  }

  const activeAbilities = checkedAbilities.filter((a) => a.available);
  const abilityCount: Record<string, number> = {};
  for (const c of group.characters) {
    for (const a of activeAbilities) {
      const lvl = c.abilities?.[a.name] ?? 0;
      if (lvl >= conflictLevel) {
        abilityCount[a.name] = (abilityCount[a.name] ?? 0) + 1;
      }
    }
  }

  for (const [ability, count] of Object.entries(abilityCount)) {
    if (count > 2) {
      warnings.push(`${ability} ${count}/2`);
    }
  }

  return warnings;
}

export default function ScheduleDetail({ scheduleId }: Props) {
  const [schedule, setSchedule] = useState<StandardSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ExtendedGroup[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  // ✅ Extract fetch so it can be reused by onRefresh
  const fetchSchedule = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`
      );
      if (!res.ok) throw new Error("Failed to fetch schedule");
      const data: StandardSchedule = await res.json();
      console.log("📥 Loaded schedule:", data);
      setSchedule(data);
      if (data.groups) setGroups(data.groups);
    } catch (err) {
      console.error("❌ Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial load
  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个排表吗？")) return;
    try {
      setDeleting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      router.push("/playground");
    } catch (err) {
      console.error("❌ Failed to delete schedule:", err);
      setDeleting(false);
    }
  };

  if (loading) return <p className={styles.loading}>加载中...</p>;
  if (!schedule) return <p className={styles.error}>未找到排表</p>;

  return (
    <div className={styles.container}>
      {/* Section 1: Basic Info with actions */}
      <BasicInfoSection
        schedule={schedule}
        onBack={() => router.push("/playground")}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {/* Section 2: Abilities (always render) */}
  <AbilityCheckingSection
  groups={groups}
  checkedAbilities={schedule.checkedAbilities}
/>

      {/* Section 3: Main Area */}
      <MainSection
        schedule={schedule}
        groups={groups}
        setGroups={setGroups}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        checkGroupQA={checkGroupQA}
      />

      {activeIdx !== null && (
        <GroupDetailModal
          scheduleId={schedule._id}       // ✅ make sure this is passed
          groupIndex={activeIdx}
          group={groups[activeIdx]}
          checkedAbilities={schedule.checkedAbilities}
          conflictLevel={schedule.conflictLevel}
          onClose={() => setActiveIdx(null)}
          onRefresh={fetchSchedule}       // ✅ refresh after PATCH
        />
      )}

      {/* <AdvancedGroups
  schedule={schedule}
  groups={groups}
  setGroups={setGroups}
  activeIdx={activeIdx}
  setActiveIdx={setActiveIdx}
  checkGroupQA={checkGroupQA}
/> */}
    </div>
  );
}
