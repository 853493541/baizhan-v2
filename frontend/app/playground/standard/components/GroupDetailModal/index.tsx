"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import GroupInfo from "./GroupInfo";
import CoreAbilityChart from "./CoreAbilityChart";
import ResultWindow from "./ResultModal";
import BossMap from "./BossMap";

import rawBossData from "../../../../data/boss_skills_collection_map.json";
const bossData: Record<string, string[]> = rawBossData;

interface Props {
  scheduleId: string;
  groupIndex: number;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
  onClose: () => void;
  onRefresh?: () => void;
}

interface WeeklyMapResponse {
  floors: Record<number, { boss: string }>;
}

export default function GroupDetailModal({
  scheduleId,
  groupIndex,
  group,
  checkedAbilities,
  conflictLevel,
  onClose,
  onRefresh,
}: Props) {
  const [weeklyMap, setWeeklyMap] = useState<Record<number, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [groupData, setGroupData] = useState<GroupResult>(group);

  // 🔄 reload current group data after use/store actions
  const handleRefresh = async () => {
    if (!scheduleId) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${scheduleId}`
      );
      if (res.ok) {
        const data = await res.json();
        const updated = data.groups.find(
          (g: any) => g.index === groupIndex
        );
        if (updated) setGroupData(updated);
        onRefresh?.(); // also trigger parent refresh if provided
      }
    } catch (err) {
      console.error("❌ Failed to refresh group data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ Load weekly map once
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`);
        if (res.ok) {
          const data: WeeklyMapResponse = await res.json();
          const floors: Record<number, string> = {};
          for (const [floor, obj] of Object.entries(data.floors)) {
            floors[Number(floor)] = obj.boss;
          }
          setWeeklyMap(floors);
        }
      } catch (err) {
        console.error("❌ Failed to load weekly map:", err);
      }
    };
    fetchMap();
  }, []);

  // ✅ Build weekly ability pool
  const weeklyAbilities = useMemo(() => {
    const result: { name: string; level: number }[] = [];
    for (const [floorStr, boss] of Object.entries(weeklyMap)) {
      const floor = Number(floorStr);
      const dropLevel = floor >= 81 && floor <= 90 ? 9 : 10;
      if (boss && bossData[boss]) {
        bossData[boss].forEach((ability) => {
          result.push({ name: ability, level: dropLevel });
        });
      }
    }
    return result;
  }, [weeklyMap]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <h2>分组{groupIndex + 1}</h2>

        {refreshing && <p className={styles.refreshing}>刷新中...</p>}

        <GroupInfo
          group={groupData}
          checkedAbilities={checkedAbilities}
          conflictLevel={conflictLevel}
        />

        {/* === Mid Section: Chart + Results === */}
        <div className={styles.midSection}>
          <CoreAbilityChart
            group={groupData}
            checkedAbilities={checkedAbilities}
            conflictLevel={conflictLevel}
            weeklyAbilities={weeklyAbilities}
          />
          {/* ✅ pass handleRefresh so ResultWindow triggers re-fetch */}
          <ResultWindow group={groupData} onRefresh={handleRefresh} />
        </div>

        <BossMap
          scheduleId={scheduleId}
          group={groupData as any}
          weeklyMap={weeklyMap}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
