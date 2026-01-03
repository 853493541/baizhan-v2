"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import GroupInfo from "./GroupInfo";
import ResultWindow from "./ResultModal";
import GroupDetail from "./ResultModal/GroupDetail";
import BossMap from "./BossMap";

import { getGameWeekFromDate } from "@/utils/weekUtils";

/* ======================================================
   TYPES
====================================================== */
interface Props {
  scheduleId: string;
  groupIndex: number;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
  onClose: () => void;
  onRefresh?: () => void;
  createdAt: string;
}

interface WeeklyMapResponse {
  week: string;
  floors: Record<number, { boss: string }>;
}

type GroupWithLifecycle = GroupResult & {
  startTime?: string | null;
  endTime?: string | null;

  // ⭐ boss overrides
  adjusted90?: string | null;
  adjusted100?: string | null;

  // ⭐ mutation state
  downgradedFloors?: number[];
};

/* ======================================================
   COMPONENT
====================================================== */
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
  const [groupData, setGroupData] = useState<GroupWithLifecycle>(group);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* -------------------------------------------------------
     ⭐ 1) Unified GAME-WEEK
  ------------------------------------------------------- */
  const { weekCode } = useMemo(() => {
    const code = getGameWeekFromDate(createdAt);
    return { weekCode: code };
  }, [createdAt]);

  /* -------------------------------------------------------
     ⭐ 2) Auto refresh group kills
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
        kills: data.kills ?? prev.kills,
        status: data.status ?? prev.status,
        startTime: data.startTime ?? prev.startTime,
        endTime: data.endTime ?? prev.endTime,
      }));

      onRefresh?.();
    } catch (err) {
      console.error("❌ Auto refresh (kills) failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, scheduleId, groupIndex, onRefresh]);

  /* -------------------------------------------------------
     ⭐ 3) Auto refresh boss overrides (90 / 100)
  ------------------------------------------------------- */
  const fetchAdjustedBoss = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${groupIndex + 1}/adjusted-boss`
      );

      if (!res.ok) return;

      const data = await res.json();

      setGroupData((prev) => ({
        ...prev,
        adjusted90: data.adjusted90 ?? prev.adjusted90,
        adjusted100: data.adjusted100 ?? prev.adjusted100,
      }));
    } catch (err) {
      console.error("❌ Auto refresh (adjusted boss) failed:", err);
    }
  }, [scheduleId, groupIndex]);

  /* -------------------------------------------------------
     ⭐ 3.5) Auto refresh downgraded floors (异)
  ------------------------------------------------------- */
  const fetchDowngradedFloors = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${groupIndex + 1}/downgraded-floors`
      );

      if (!res.ok) return;

      const data = await res.json();

      setGroupData((prev) => ({
        ...prev,
        downgradedFloors:
          data.downgradedFloors ?? prev.downgradedFloors,
      }));
    } catch (err) {
      console.error("❌ Auto refresh (downgraded floors) failed:", err);
    }
  }, [scheduleId, groupIndex]);

  /* -------------------------------------------------------
     ⭐ Polling timers
  ------------------------------------------------------- */
  useEffect(() => {
    const killTimer = setInterval(fetchGroupKills, 5000);
    return () => clearInterval(killTimer);
  }, [fetchGroupKills]);

  useEffect(() => {
    const bossTimer = setInterval(fetchAdjustedBoss, 5000);
    return () => clearInterval(bossTimer);
  }, [fetchAdjustedBoss]);

  useEffect(() => {
    const downgradeTimer = setInterval(fetchDowngradedFloors, 5000);
    return () => clearInterval(downgradeTimer);
  }, [fetchDowngradedFloors]);

  /* -------------------------------------------------------
     ⭐ 4) Load historical weekly map
  ------------------------------------------------------- */
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/past?week=${weekCode}`
        );

        let data: WeeklyMapResponse | null = null;

        if (res.ok) {
          data = await res.json();
        } else {
          const fallback = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`
          );
          if (fallback.ok) data = await fallback.json();
        }

        if (!data) return;

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
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <GroupInfo
          group={groupData}
          checkedAbilities={checkedAbilities}
          conflictLevel={conflictLevel}
        />

        <div className={styles.midSection}>
          <GroupDetail
            group={groupData}
            checkedAbilities={checkedAbilities}
          />

          <ResultWindow
            scheduleId={scheduleId}
            group={groupData}
            onRefresh={fetchGroupKills}
          />
        </div>

        <BossMap
          scheduleId={scheduleId}
          group={groupData as any}
          weeklyMap={weeklyMap}
          onRefresh={fetchGroupKills}
          onGroupUpdate={(updated) =>
            setGroupData(updated as GroupWithLifecycle)
          }
        />
      </div>
    </div>
  );
}
