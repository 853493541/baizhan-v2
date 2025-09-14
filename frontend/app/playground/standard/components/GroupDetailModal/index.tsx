"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import BasicInfo from "./BasicInfo";
import BossMap from "./BossMap";

interface Props {
  groupIndex: number;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
  onClose: () => void;
}

interface WeeklyMapResponse {
  floors: Record<number, { boss: string }>;
}

export default function GroupDetailModal({
  groupIndex,
  group,
  checkedAbilities,
  conflictLevel,
  onClose,
}: Props) {
  const [weeklyMap, setWeeklyMap] = useState<Record<number, string>>({});

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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <h2>分组{groupIndex + 1}</h2>

        <BasicInfo
          group={group}
          checkedAbilities={checkedAbilities}
          conflictLevel={conflictLevel}
        />

        <BossMap group={group} weeklyMap={weeklyMap} />
      </div>
    </div>
  );
}
