/**
 * ReversedSolver.ts
 * -----------------------------
 * Minimal logging version.
 * - Logs only core violations in one line.
 * - Scoring:
 *   • Missing CORE → -1000 and terminate early
 *   • Non-core Lv9 ✅ → +1
 *   • Non-core Lv10 ✅ → +10
 */

interface Character {
  _id: string;
  name: string;
  account: string;
  needs?: { name: string; level: number }[];
}

interface Group {
  index: number;
  members: Character[];
}

interface AbilitySummary {
  ability: string;
  neededGroups: number;
}

interface SolverInput {
  groups: Group[];
  abilitySummary: AbilitySummary[];
  coreAbilities: string[];
}

export function runReversedSolver(input: SolverInput) {
  const { groups, abilitySummary, coreAbilities } = input;

  let totalScore = 0;
  let coreViolated = false;
  const penalized: string[] = [];

  // 🟢 Separate core and non-core abilities
  const coreList = abilitySummary.filter((a) =>
    coreAbilities.includes(a.ability)
  );
  const otherList = abilitySummary.filter(
    (a) => !coreAbilities.includes(a.ability)
  );

  // 🔍 Check one ability and update score
  const checkAbility = (a: AbilitySummary, isCore: boolean) => {
    const abilityName = a.ability;
    const isLv10 = abilityName.endsWith("10");
    const isLv9 = abilityName.endsWith("9");

    const groupNeedCount = groups.reduce((count, g) => {
      const hasNeed = g.members.some((m) =>
        m.needs?.some((n) => `${n.name}${n.level}` === abilityName)
      );
      return count + (hasNeed ? 1 : 0);
    }, 0);

    // 🧮 Scoring logic
    if (isCore) {
      if (groupNeedCount < a.neededGroups) {
        coreViolated = true;
        totalScore -= 1000;
        penalized.push(abilityName);
        console.warn(
          // `[Reversed Solver] ❌ CORE VIOLATION → ${abilityName} missing in required groups (${groupNeedCount}/${a.neededGroups})`
        );
      }
    } else if (groupNeedCount >= a.neededGroups) {
      totalScore += isLv10 ? 10 : isLv9 ? 1 : 0;
    } else {
      penalized.push(abilityName);
    }
  };

  // ✅ Step 1: Core abilities first (stop early if missing)
  for (const a of coreList) {
    checkAbility(a, true);
    if (coreViolated) {
      return {
        status: "core_violation",
        totalGroups: groups.length,
        totalAbilities: abilitySummary.length,
        penalized,
        totalScore,
      };
    }
  }

  // 🟡 Step 2: Non-core abilities
  for (const a of otherList) {
    checkAbility(a, false);
  }

  // ✅ Final result
  return {
    status: "checked",
    totalGroups: groups.length,
    totalAbilities: abilitySummary.length,
    penalized,
    totalScore,
  };
}
