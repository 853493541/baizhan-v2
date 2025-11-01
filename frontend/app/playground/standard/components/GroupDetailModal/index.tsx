"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const [groupData, setGroupData] = useState<GroupResult>(group);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* -------------------- Handlers -------------------- */
  const handleGroupUpdate = useCallback((updatedGroup: GroupResult) => {
    if (updatedGroup) setGroupData(updatedGroup);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!scheduleId) return;
    setRefreshing(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const updated = data.groups.find((g: any) => g.index === groupIndex + 1);
      if (updated) setGroupData(updated);
      onRefresh?.();
    } catch (err) {
      console.error("❌ Failed to refresh group data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [scheduleId, groupIndex, onRefresh]);

  /* -------------------- Auto refresh every 5s (with guard) -------------------- */
  const fetchGroupKills = useCallback(async () => {
    if (isRefreshing) return; // ✅ guard prevents overlapping fetches

    try {
      setIsRefreshing(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${groupIndex + 1}/kills`
      );
      if (!res.ok) return;
      const data = await res.json();
      setGroupData((prev) => ({
        ...prev,
        kills: data.kills || prev.kills,
        status: data.status || prev.status,
      }));
      onRefresh?.();
    } catch (err) {
      console.error("❌ Auto refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, scheduleId, groupIndex, onRefresh]);

  /* -------------------- Load weekly map once -------------------- */
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

  /* -------------------- Fetch characters once -------------------- */
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!groupData?.characters?.length) return;
      setLoadingCharacters(true);
      try {
        const detailedChars = await Promise.all(
          groupData.characters.map(async (c: any) => {
            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/characters/${c._id}`
              );
              if (!res.ok) throw new Error(`Character ${c._id} fetch failed`);
              return await res.json();
            } catch (err) {
              console.warn("⚠️ Failed to fetch one character:", c._id, err);
              return c;
            }
          })
        );
        setGroupData((prev) => ({ ...prev, characters: detailedChars }));
      } catch (err) {
        console.error("❌ Failed to fetch group characters:", err);
      } finally {
        setLoadingCharacters(false);
      }
    };
    fetchCharacters();
  }, [groupData.index]);

  /* -------------------- Weekly ability pool -------------------- */
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

  /* -------------------- Render -------------------- */
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* === Close Button === */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

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

          <ResultWindow
            scheduleId={scheduleId}
            group={groupData}
            onRefresh={handleRefresh}
          />
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
