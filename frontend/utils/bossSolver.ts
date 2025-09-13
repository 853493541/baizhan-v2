// utils/bossSolver.ts

export type Role = "DPS" | "Tank" | "Healer";

export interface Ability {
  name: string;
  level: number;
}

export interface Character {
  _id: string;
  name: string;
  role: Role;
  account: string;
  abilities: Ability[];
}

interface SolverOptions {
  characters: Character[];
  groupSize: number;
  groupCount: number;
  flexRequired: string[];
  locked: string[][];   // per slot
  roles: Role[];        // per slot
}

interface SolverResult {
  success: boolean;
  groups: {
    index: number;
    characters: (Character & { usedAbilities: Ability[] })[];
    coveredAbilities: string[];
  }[];
  errors: string[];
  missing: string[];
}

// ✅ helper: pick the best (highest level) ability
function pickBestAbility(c: Character, name: string): Ability | null {
  const found = c.abilities
    .filter((a) => a.name === name)
    .sort((a, b) => b.level - a.level);
  return found.length > 0 ? found[0] : null;
}

// ✅ helper: fill up to exactly 3 abilities
function fillToThree(c: Character & { usedAbilities: Ability[] }) {
  if (c.usedAbilities.length >= 3) {
    // trim to top 3 highest level if overfilled
    c.usedAbilities = c.usedAbilities
      .slice()
      .sort((a, b) => b.level - a.level)
      .slice(0, 3);
    return;
  }

  const sorted = c.abilities
    .slice()
    .sort((a, b) => b.level - a.level);

  for (const ab of sorted) {
    if (c.usedAbilities.find((u) => u.name === ab.name)) continue;
    c.usedAbilities.push(ab);
    if (c.usedAbilities.length >= 3) break;
  }
}

export function bossSolver(opts: SolverOptions): SolverResult {
  const { characters, groupSize, groupCount, flexRequired, locked, roles } = opts;

  const groups: SolverResult["groups"] = [];
  const errors: string[] = [];
  const missing: string[] = [];

  // character pool (consume as used)
  const pool = [...characters];

  for (let g = 0; g < groupCount; g++) {
    const groupChars: (Character & { usedAbilities: Ability[] })[] = [];
    const covered: string[] = [];

    for (let slot = 0; slot < groupSize; slot++) {
      const requiredRole = roles[slot];
      const requiredLocks = locked[slot];

      // enforce account uniqueness
      const candidate = pool.find((c) => {
        if (requiredRole === "Healer" && c.role !== "Healer") return false;
        if (groupChars.some((gc) => gc.account === c.account)) return false;

        const missingLocks = requiredLocks.filter(
          (ability) => ability !== "FLEX" && !c.abilities.find((a) => a.name === ability)
        );
        if (missingLocks.length > 0) return false;

        return true;
      });

      if (!candidate) {
        errors.push(`小组 ${g + 1}: 无法满足 ${requiredRole} 位的锁定要求`);
        break;
      }

      // assign locked abilities (best level version)
      const usable: Ability[] = [];
      for (const lock of requiredLocks) {
        if (lock === "FLEX" || !lock) continue;
        const found = pickBestAbility(candidate, lock);
        if (found) usable.push(found);
      }

      groupChars.push({
        ...candidate,
        usedAbilities: usable,
      });

      // consume candidate
      const idx = pool.indexOf(candidate);
      if (idx !== -1) pool.splice(idx, 1);

      covered.push(...usable.map((a) => a.name));
    }

    // check group is valid
    if (groupChars.length === groupSize) {
      // flex abilities (assign greedily)
      for (const flex of flexRequired) {
        if (groupChars.some((c) => c.usedAbilities.some((a) => a.name === flex))) continue;

        let bestChar: typeof groupChars[number] | null = null;
        let bestAbility: Ability | null = null;

        for (const c of groupChars) {
          if (c.usedAbilities.length >= 3) continue;
          const candidate = pickBestAbility(c, flex);
          if (!candidate) continue;
          if (!bestAbility || candidate.level > bestAbility.level) {
            bestAbility = candidate;
            bestChar = c;
          }
        }

        if (bestChar && bestAbility) {
          bestChar.usedAbilities.push(bestAbility);
          covered.push(bestAbility.name);
        }
      }

      // fill all chars to exactly 3
      for (const c of groupChars) {
        fillToThree(c);
      }

      // ✅ healer must be present
      if (!groupChars.some((c) => c.role === "Healer")) {
        errors.push(`小组 ${g + 1}: 缺少治疗`);
      }

      groups.push({
        index: g + 1,
        characters: groupChars,
        coveredAbilities: covered,
      });
    }
  }

  // missing flex abilities overall
  for (const f of flexRequired) {
    if (!groups.some((g) => g.coveredAbilities.includes(f))) {
      missing.push(f);
    }
  }

  return {
    success: errors.length === 0,
    groups,
    errors,
    missing,
  };
}
