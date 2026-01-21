"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import GroupInfo from "./GroupInfo";
import ResultWindow from "./ResultModal";
import BossMap from "./BossMap";
import Manager from "@/app/characters/components/Manager";

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
  const [managerCharId, setManagerCharId] = useState<string | null>(null);

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
  const weekCode = useMemo(
    () => getGameWeekFromDate(createdAt),
    [createdAt]
  );

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
    <>
      {/* ================== GROUP DETAIL MODAL ================== */}
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 🔝 GROUP HEADER */}
          <GroupInfo
            group={groupData}
            checkedAbilities={checkedAbilities}
            conflictLevel={conflictLevel}
            onClose={onClose}
            onOpenManager={(id) => setManagerCharId(id)}
          />

          <div className={styles.midSection}>
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
              setGroupData((prev) => ({
                ...prev,
                ...updated,
              }))
            }
          />
        </div>
      </div>

      {/* ================== MANAGER MODAL ================== */}
      {managerCharId && (
        <Manager
          characterId={managerCharId}
          API_URL={process.env.NEXT_PUBLIC_API_URL!}
          onClose={() => setManagerCharId(null)}
          onUpdated={(updatedChar) => {
            /**
             * ✅ IMPORTANT:
             * We DO NOT replace the solver character.
             * We PATCH only fields that logically belong to the solver snapshot.
             */
            setGroupData((prev) => ({
              ...prev,
              characters: prev.characters.map((c) =>
                c._id === updatedChar._id
                  ? {
                      ...c,
                      abilities: updatedChar.abilities ?? c.abilities,
                    }
                  : c
              ),
            }));
          }}
        />
      )}
    </>
  );
}
