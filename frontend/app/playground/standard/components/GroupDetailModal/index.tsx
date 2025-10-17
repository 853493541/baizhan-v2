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
  const [groupData, setGroupData] = useState<GroupResult>(group);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  /* 🕒 Auto-refresh countdown */
  const [countdown, setCountdown] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ When BossMap updates instantly
  const handleGroupUpdate = (updatedGroup: GroupResult) => {
    if (!updatedGroup) return;
    console.log("[GroupDetailModal] received updated group:", updatedGroup);
    setGroupData(updatedGroup);
  };

  // 🔄 Full reload (manual or from children)
  const handleRefresh = async () => {
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
  };

  // ✅ Lightweight auto-refresh (kills + status only)
  useEffect(() => {
    if (!scheduleId) return;

    const fetchGroupKills = async () => {
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
    };

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchGroupKills();
          return 5; // ⏱️ now every 5 seconds
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduleId, groupIndex]);

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

  // ✅ Fetch character details once
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
              const full = await res.json();
              return full;
            } catch (err) {
              console.warn("⚠️ Failed to fetch one character:", c._id, err);
              return c;
            }
          })
        );
        setGroupData((prev) => ({
          ...prev,
          characters: detailedChars,
        }));
      } catch (err) {
        console.error("❌ Failed to fetch group characters:", err);
      } finally {
        setLoadingCharacters(false);
      }
    };

    fetchCharacters();
  }, [groupData.index]);

  // ✅ Weekly ability pool
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
        {/* === Close button === */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        {/* <h2>分组 {groupIndex + 1}</h2> */}

        {/* {loadingCharacters && (
          // <div className={styles.loadingText}>正在加载角色详情...</div>
        )} */}

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
            countdown={countdown}
            onRefresh={handleRefresh}
          />
        </div>

        {/* === Bottom Section: Boss Map === */}
        <BossMap
          scheduleId={scheduleId}
          group={groupData as any}
          weeklyMap={weeklyMap}
          countdown={countdown}
          onRefresh={handleRefresh}
          onGroupUpdate={handleGroupUpdate}
        />
      </div>
    </div>
  );
}
