"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import GroupInfo from "./GroupInfo";
import ResultWindow from "./ResultModal";
import BossMap from "./BossMap";

import { getGameWeekFromDate } from "@/utils/weekUtils";  // ⭐ unified week logic

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
  createdAt: string;      // ⭐ receives schedule createdAt
}

interface WeeklyMapResponse {
  week: string;
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
  createdAt,
}: Props) {
  const [weeklyMap, setWeeklyMap] = useState<Record<number, string>>({});
  const [groupData, setGroupData] = useState<GroupResult>(group);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  /* -------------------------------------------------------
     ⭐ 1) Unified GAME-WEEK for this schedule's createdAt
  ------------------------------------------------------- */
  const { year, week, weekCode } = useMemo(() => {
    const code = getGameWeekFromDate(createdAt);   // e.g., "2025-W48"
    const [y, w] = code.split("-W").map(Number);
    return { year: y, week: w, weekCode: code };
  }, [createdAt]);

  /* -------------------------------------------------------
     ⭐ 2) Auto refresh group kills every 5 sec
  ------------------------------------------------------- */
  const fetchGroupKills = useCallback(async () => {
    if (isRefreshing) return;
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

  /* -------------------------------------------------------
     ⭐ Countdown timer (UI + trigger only)
  ------------------------------------------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchGroupKills();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchGroupKills]);

  /* -------------------------------------------------------
     ⭐ 3) Load the correct HISTORICAL weekly map
  ------------------------------------------------------- */
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/past?week=${weekCode}`
        );

        if (!res.ok) {
          const fallback = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`
          );
          if (fallback.ok) {
            const data: WeeklyMapResponse = await fallback.json();
            const floors: Record<number, string> = {};
            for (const [floor, obj] of Object.entries(data.floors)) {
              floors[Number(floor)] = obj.boss;
            }
            setWeeklyMap(floors);
          }
          return;
        }

        const data: WeeklyMapResponse = await res.json();
        const floors: Record<number, string> = {};
        for (const [floor, obj] of Object.entries(data.floors)) {
          floors[Number(floor)] = obj.boss;
        }
        setWeeklyMap(floors);
      } catch (err) {
        console.error("❌ Failed to load historical weekly map:", err);
      }
    };

    fetchMap();
  }, [weekCode]);

  /* -------------------------------------------------------
     ⭐ RENDER
  ------------------------------------------------------- */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✖</button>

        {/* 🔁 Parent-owned refresh countdown
        <div className={styles.refreshHint}>
          {countdown} 秒后自动刷新
        </div> */}

        <GroupInfo
          group={groupData}
          checkedAbilities={checkedAbilities}
          conflictLevel={conflictLevel}
        />

        <div className={styles.midSection}>
          <ResultWindow
            scheduleId={scheduleId}
            group={groupData}
            countdown={countdown}
            onRefresh={fetchGroupKills}
          />
        </div>

        <BossMap
          scheduleId={scheduleId}
          group={groupData as any}
          weeklyMap={weeklyMap}
          onRefresh={fetchGroupKills}
          onGroupUpdate={(updated) => setGroupData(updated)}
        />
      </div>
    </div>
  );
}
