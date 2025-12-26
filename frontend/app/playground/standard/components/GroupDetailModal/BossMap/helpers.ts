// BossMap/bossMapHelpers.ts

import type { ExtendedGroup } from "./types";

/**
 * Resolve which boss name should be shown on a given floor
 */
export function resolveBoss(
  floor: number,
  weeklyMap: Record<number, string>,
  group: ExtendedGroup
) {
  if (floor === 90 && group.adjusted90) return group.adjusted90;
  if (floor === 100 && group.adjusted100) return group.adjusted100;
  return weeklyMap[floor];
}
