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
  groupIndex: number; // 0-based index passed from parent
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

  // 🧩 Shared group data drives both BossMap and ResultWindow
  const [groupData, setGroupData] = useState<GroupResult>(group);

  // ✅ When BossMap updates instantly
  const handleGroupUpdate = (updatedGroup: GroupResult) => {
    if (!updatedGroup) return;
    console.log("[GroupDetailModal] received updated group:", updatedGroup);
    setGroupData(updatedGroup);
  };

  // 🔄 Reload full group data from backend
  const handleRefresh = async () => {
    if (!scheduleId) return;
    setRefreshing(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`;
      console.log("[GroupDetailModal] handleRefresh →", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("[GroupDetailModal] backend returned:", data);

      // ✅ groupIndex is 0-based, backend group.index starts at 1
      const updated = data.groups.find((g: any) => g.index === groupIndex + 1);
      if (updated) {
        console.log(
          `[GroupDetailModal] found group with backend index ${groupIndex + 1}`,
          updated
        );
        setGroupData(updated);
      } else {
        console.warn(`[GroupDetailModal] No matching group found for index: ${groupIndex}`);
      }

      onRefresh?.(); // optional parent refresh
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
          console.log("[GroupDetailModal] Weekly map loaded:", floors);
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

        <h2>分组 {groupIndex + 1}</h2>

        {/* === Top Section: Group Info === */}
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
          {/* ✅ ResultWindow now reacts instantly to BossMap updates */}
          <ResultWindow group={groupData} onRefresh={handleRefresh} />
        </div>

        {/* === Bottom Section: Boss Map === */}
        <BossMap
          scheduleId={scheduleId}
          group={groupData as any}
          weeklyMap={weeklyMap}
          onRefresh={handleRefresh}
          onGroupUpdate={handleGroupUpdate}
        />
      </div>
    </div>
  );
}
