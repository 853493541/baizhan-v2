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

/**
 * Fill skeletons with actual characters from the dataset.
 * Each slot's account is replaced by one character of that account.
 */
export function fillSkeletonsWithCharacters(
  skeletons: Skeleton[],
  characters: Character[]
): FilledSkeleton[] {
  const results: FilledSkeleton[] = [];

  for (let si = 0; si < skeletons.length; si++) {
    const s = skeletons[si];

    // Track which characters are already used globally
    const usedCharIds = new Set<string>();

    const filledGroups: FilledGroup[] = s.groups.map((g) => {
      const members: Character[] = [];

      for (const slot of g.slots) {
        // Candidates = all characters of this account not yet used
        const candidates = characters.filter(
          (c) =>
            c.account === slot.account && !usedCharIds.has(c._id)
        );

        // Prefer role match if possible
        let chosen: Character | undefined = candidates.find(
          (c) => c.role === slot.role
        );
        if (!chosen && candidates.length > 0) chosen = candidates[0];

        if (chosen) {
          members.push(chosen);
          usedCharIds.add(chosen._id);
        }
      }

      return { index: g.index, members };
    });

    results.push({ index: si, groups: filledGroups });
  }

  return results;
}
