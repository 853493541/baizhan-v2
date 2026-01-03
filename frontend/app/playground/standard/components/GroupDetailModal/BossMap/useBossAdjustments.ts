// BossMap/useBossAdjustments.ts
"use client";

import type { ExtendedGroup } from "./types";

/* 🧬 mutation downgrade rules */
const MUTATION_DOWNGRADE: Record<string, string> = {
  "青年程沐华": "程沐华",
  "困境韦柔丝": "韦柔丝",
  "肖红": "肖童",
};

export function useBossAdjustments(
  group: ExtendedGroup,
  weeklyMap: Record<number, string>
) {
  const resolveBoss = (floor: number): string | undefined => {
    let boss: string | undefined;

    // 🔁 90 / 100 manual override first
    if (floor === 90 && group.adjusted90) {
      boss = group.adjusted90;
    } else if (floor === 100 && group.adjusted100) {
      boss = group.adjusted100;
    } else {
      boss = weeklyMap[floor];
    }

    if (!boss) return boss;

    // 🧬 mutation (异): check ARRAY
    if (group.downgradedFloors?.includes(floor)) {
      return MUTATION_DOWNGRADE[boss] ?? boss;
    }

    return boss;
  };

  return { resolveBoss };
}
