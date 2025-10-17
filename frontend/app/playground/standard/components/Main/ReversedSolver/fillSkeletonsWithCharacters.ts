// utils/fillSkeletonsWithCharacters.ts
import type { Skeleton } from "./generateAccountSkeletons";

interface Character {
  _id: string;
  name: string;
  account: string;
  role: "DPS" | "Healer" | "Tank";
}

interface FilledGroup {
  index: number;
  members: Character[];
}

export interface FilledSkeleton {
  index: number;
  groups: FilledGroup[];
}

/** 🧩 Define main characters that must NOT be in the same group */
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

/**
 * Fill skeletons with actual characters from the dataset.
 * ✅ Each slot’s account is replaced by one available character.
 * ✅ Main characters cannot appear together in the same group.
 * ✅ Skeletons that produce incomplete groups are retried internally (maxRetries=5).
 */
export function fillSkeletonsWithCharacters(
  skeletons: Skeleton[],
  characters: Character[],
  opts?: { groupSize?: number; maxRetries?: number }
): FilledSkeleton[] {
  const results: FilledSkeleton[] = [];
  const groupSize = opts?.groupSize ?? 3;
  const maxRetries = opts?.maxRetries ?? 5;

  for (let si = 0; si < skeletons.length; si++) {
    const s = skeletons[si];
    let validGroups: FilledGroup[] | null = null;

    // 🔁 Retry until valid
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const usedCharIds = new Set<string>();
      const filledGroups: FilledGroup[] = s.groups.map((g) => {
        const members: Character[] = [];

        for (const slot of g.slots) {
          // find all available characters from this account
          const candidates = characters.filter(
            (c) => c.account === slot.account && !usedCharIds.has(c._id)
          );

          // prefer role match first
          let chosen: Character | undefined = candidates.find(
            (c) => c.role === slot.role
          );
          if (!chosen && candidates.length > 0) {
            // randomize fallback choice for variation
            chosen = candidates[Math.floor(Math.random() * candidates.length)];
          }

          if (chosen) {
            // 🧩 prevent multiple main characters in one group
            const hasMainInGroup = members.some((m) =>
              MAIN_CHARACTERS.has(m.name)
            );
            if (MAIN_CHARACTERS.has(chosen.name) && hasMainInGroup) {
              continue; // skip second main character in same group
            }

            members.push(chosen);
            usedCharIds.add(chosen._id);
          }
        }

        return { index: g.index, members };
      });

      // ✅ Validate
      const allFull = filledGroups.every(
        (g) => g.members.length === groupSize
      );
      const noMainConflict = filledGroups.every((g) => {
        const mainCount = g.members.filter((m) =>
          MAIN_CHARACTERS.has(m.name)
        ).length;
        return mainCount <= 1;
      });

      if (allFull && noMainConflict) {
        validGroups = filledGroups;
        break;
      }
    }

    // push only valid skeletons
    if (validGroups) {
      results.push({ index: si, groups: validGroups });
    }
  }

  return results;
}
