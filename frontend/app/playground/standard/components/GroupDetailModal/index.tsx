"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import GroupInfo from "./GroupInfo";
import ResultWindow from "./ResultModal";
import GroupDetail from "./ResultModal/GroupDetail";
import BossMap from "./BossMap";

import { getGameWeekFromDate } from "@/utils/weekUtils";
import { usePageSync } from "./pageSync";

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

  /* -------------------------------------------------------
     ⭐ Page sync (authoritative server sync)
  ------------------------------------------------------- */
  const {
    groupData,
    setGroupData,
    syncKills,
  } = usePageSync({
    scheduleId,
    groupIndex,
    initialGroup: group,
    onRefresh,
  });

  /* -------------------------------------------------------
     ⭐ Unified GAME-WEEK
  ------------------------------------------------------- */
  const { weekCode } = useMemo(() => {
    const code = getGameWeekFromDate(createdAt);
    return { weekCode: code };
  }, [createdAt]);

  /* -------------------------------------------------------
     ⭐ Load historical weekly map
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
  <button
  className={styles.closeBtn}
  onClick={onClose}
  aria-label="Close"
>
  ✕
</button>


        <GroupInfo
          group={groupData}
          checkedAbilities={checkedAbilities}
          conflictLevel={conflictLevel}
        />

        <div className={styles.midSection}>
          {/* <GroupDetail
            group={groupData}
            checkedAbilities={checkedAbilities}
          /> */}

          <ResultWindow
           checkedAbilities={checkedAbilities}
            scheduleId={scheduleId}
            group={groupData}
            onRefresh={syncKills}
          />
        </div>

        <BossMap
          scheduleId={scheduleId}
          group={groupData as any}
          weeklyMap={weeklyMap}
          onRefresh={syncKills}
          onGroupUpdate={(updated) =>
            // ✅ PATCH, never replace
            setGroupData(prev => ({
              ...prev,
              ...updated,
            }))
          }
        />
      </div>
    </div>
  );
}
