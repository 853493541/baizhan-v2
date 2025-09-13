// utils/bossSolver.ts

export type Role = "DPS" | "Tank" | "Healer";

export interface Character {
  _id: string;
  name: string;
  role: Role;
  account: string;
  abilities: string[];
}

interface SolverOptions {
  characters: Character[];
  groupSize: number;
  groupCount: number;
  flexRequired: string[];
  locked: string[][];
  roles: Role[];
}

interface SolverResult {
  success: boolean;
  groups: {
    index: number;
    characters: (Character & { usedAbilities: string[] })[];
    coveredAbilities: string[];
  }[];
  errors: string[];
  missing: string[];
}

export function bossSolver(opts: SolverOptions): SolverResult {
  const { characters, groupSize, groupCount, flexRequired, locked, roles } = opts;

  const groups: SolverResult["groups"] = [];
  const errors: string[] = [];
  const missing: string[] = [];

  // clone char pool so we can consume them
  const pool = [...characters];

  for (let g = 0; g < groupCount; g++) {
    const groupChars: (Character & { usedAbilities: string[] })[] = [];
    const covered: string[] = [];

    for (let slot = 0; slot < groupSize; slot++) {
      const requiredRole = roles[slot];
      const requiredLocks = locked[slot];

      const candidate = pool.find((c) => {
        if (requiredRole === "Healer" && c.role !== "Healer") return false;

        console.log(
          `[BossSolver][Debug] Checking group ${g + 1}, slot ${slot + 1}, role=${requiredRole}`
        );
        console.log(
          `  Candidate: ${c.name} (${c.role}) – abilities: ${c.abilities.join("，")}`
        );
        console.log(`  Required locked abilities: ${requiredLocks.join("，")}`);

        const missingLocks = requiredLocks.filter(
          (ability) => ability !== "FLEX" && !c.abilities.includes(ability)
        );

        if (missingLocks.length > 0) {
          console.warn(
            `[BossSolver][Debug] ❌ ${c.name} missing locked abilities: ${missingLocks.join("，")}`
          );
          return false;
        }

        console.log(
          `[BossSolver][Debug] ✅ ${c.name} satisfies all locked abilities`
        );
        return true;
      });

      if (!candidate) {
        errors.push(`小组 ${g + 1}：无法满足${requiredRole}位的锁定技能要求`);
        break;
      }

      // assign locked abilities directly
      const usable = requiredLocks.filter((a) => a !== "FLEX" && a !== "");

      groupChars.push({
        ...candidate,
        usedAbilities: [...usable],
      });

      // consume this candidate so it can't be reused
      const idx = pool.indexOf(candidate);
      if (idx !== -1) pool.splice(idx, 1);

      covered.push(...usable);
    }

    if (groupChars.length === groupSize) {
      // distribute flex abilities once per group
      for (const flex of flexRequired) {
        const target = groupChars.find(
          (c) =>
            c.usedAbilities.length < 3 && c.abilities.includes(flex)
        );
        if (target) {
          target.usedAbilities.push(flex);
          covered.push(flex);
        }
      }

      groups.push({
        index: g + 1,
        characters: groupChars,
        coveredAbilities: covered,
      });
    }
  }

  // find which flex abilities are missing overall
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
