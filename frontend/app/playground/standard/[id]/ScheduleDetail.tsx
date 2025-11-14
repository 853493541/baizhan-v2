"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { GroupResult, Character, AbilityCheck } from "@/utils/solver";

import GroupDetailModal from "../components/GroupDetailModal";
import AnalyzerSection from "../components/AnalyzerSection";
import BasicInfoSection from "../components/BasicInfo";
import MainSection from "../components/Main";
import { useRouter } from "next/navigation";

// ⭐ Edit Characters Modal
import EditScheduleCharactersModal from "../components/EditCharactersModal";

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
  characterCount: number; // not used anymore
  characters: Character[];
  groups?: ExtendedGroup[];
}

interface Props {
  scheduleId: string;
}

// =============================
// 🔍 Group QA checker
// =============================
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
        abilityCount[a.name] = (abilityCount[a.name] || 0) + 1;
      }
    }
  }

  for (const [ability, count] of Object.entries(abilityCount)) {
    if (count > 2) warnings.push(`${ability} ${count}/2`);
  }

  return warnings;
}

// =============================
// 🔵 MAIN COMPONENT
// =============================
export default function ScheduleDetail({ scheduleId }: Props) {
  const [schedule, setSchedule] = useState<StandardSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ExtendedGroup[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editCharsOpen, setEditCharsOpen] = useState(false);
  const router = useRouter();

  // =============================
  // 🔵 Fetch schedule
  // =============================
  const fetchSchedule = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`
      );
      if (!res.ok) throw new Error("Failed to fetch schedule");

      const data: StandardSchedule = await res.json();
      setSchedule(data);
      if (data.groups) setGroups(data.groups);
    } catch (err) {
      console.error("❌ Failed to fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  // =============================
  // 🟣 Live character count updater
  // =============================
  const updateLocalCharacterCount = (ids: Set<string>) => {
    setSchedule((prev) =>
      prev
        ? {
            ...prev,
            // filter existing characters to match new IDs
            characters: prev.characters.filter((c) => ids.has(c._id)),
          }
        : prev
    );
  };

  // =============================
  // 🔴 Delete schedule
  // =============================
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");

      router.push("/playground");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      setDeleting(false);
    }
  };

  if (loading) return <p className={styles.loading}>加载中...</p>;
  if (!schedule) return <p className={styles.error}>未找到排表</p>;

  const locked =
    groups?.some((g) => g.status === "started" || g.status === "finished") ??
    false;

  // =============================
  // 🟦 RENDER
  // =============================
  return (
    <div className={styles.container}>
      {/* 🟦 Basic Info */}
      <BasicInfoSection
        schedule={schedule}
        onBack={() => router.push("/playground")}
        onDelete={handleDelete}
        deleting={deleting}
        locked={locked}
        onOpenEditCharacters={() => setEditCharsOpen(true)}
      />

      {/* 🟦 Analyzer */}
      <AnalyzerSection
        groups={groups}
        checkedAbilities={schedule.checkedAbilities}
      />

      {/* 🟦 Groups */}
      <MainSection
        schedule={schedule}
        groups={groups}
        setGroups={setGroups}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        checkGroupQA={checkGroupQA}
      />

      {/* 🟦 Group Detail Modal */}
      {activeIdx !== null && (
        <GroupDetailModal
          scheduleId={schedule._id}
          groupIndex={activeIdx}
          group={groups[activeIdx]}
          checkedAbilities={schedule.checkedAbilities}
          conflictLevel={schedule.conflictLevel}
          onClose={() => setActiveIdx(null)}
          onRefresh={fetchSchedule}
        />
      )}

      {/* 🟦 Edit Characters Modal */}
      {editCharsOpen && schedule && (
        <EditScheduleCharactersModal
          schedule={schedule}
          onClose={() => setEditCharsOpen(false)}
          onUpdated={fetchSchedule}
          onLocalUpdate={updateLocalCharacterCount}   // ⭐ LIVE UPDATE
        />
      )}
    </div>
  );
}
