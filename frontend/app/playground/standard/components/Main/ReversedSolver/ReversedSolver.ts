/**
 * ReversedSolver.ts
 * -----------------------------
 * Adds hard-fail logic for core abilities:
 *  - If any core ability ❌ → instantly stop and log "CORE VIOLATION".
 * Scoring:
 *  - Missing CORE → -1000 and terminate
 *  - Non-core ✅ Lv9 → +1
 *  - Non-core ✅ Lv10 → +10
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

  console.log("🧩 [Reversed Solver] Input received ------------------");
  console.log(`[Reversed Solver] 总组数: ${groups.length}`);
  console.log(`[Reversed Solver] 能力数量: ${abilitySummary.length}`);
  console.log("[Reversed Solver] Weekly Core Abilities:", coreAbilities);
  console.log("[Reversed Solver] === Ability Coverage Check ===");

  const penalized: string[] = [];
  let totalScore = 0;
  let coreViolated = false;

  // 🟢 Separate core and non-core abilities
  const coreList = abilitySummary.filter((a) => coreAbilities.includes(a.ability));
  const otherList = abilitySummary.filter((a) => !coreAbilities.includes(a.ability));

  // 🔍 Helper to check one ability and apply score
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

    const mark = groupNeedCount < a.neededGroups ? "❌" : "✅";
    const tag = isCore ? "(CORE)" : "";

    // 🧮 Scoring
    if (isCore) {
      if (mark === "❌") {
        coreViolated = true;
        totalScore -= 1000;
      }
    } else if (mark === "✅") {
      totalScore += isLv10 ? 10 : isLv9 ? 1 : 0;
    }

    if (mark === "❌") penalized.push(abilityName);

    console.log(
      `[Reversed Solver] ${abilityName.padEnd(12)} ${String(
        groupNeedCount
      ).padStart(2)}/${a.neededGroups}  → ${mark} ${tag}`
    );
  };

  // ✅ Check core abilities first
  for (const a of coreList) {
    checkAbility(a, true);
    if (coreViolated) {
      console.log("🚨 [Reversed Solver] CORE VIOLATION — Aborting further checks.");
      console.log("--------------------------------------------------");
      console.log(`[Reversed Solver] ❌ Invalid schedule due to missing core ability.`);
      console.log(`[Reversed Solver] 🧮 Total Score: ${totalScore}`);
      console.log("[Reversed Solver] --------------------------------------------------");
      return {
        status: "core_violation",
        totalGroups: groups.length,
        totalAbilities: abilitySummary.length,
        penalized,
        totalScore,
      };
    }
  }

  // 🟡 Then check non-core abilities
  otherList.forEach((a) => checkAbility(a, false));

  console.log("--------------------------------------------------");
  console.log(
    `[Reversed Solver] ✅ Check Complete. Penalized (${penalized.length}):`,
    penalized.length > 0 ? penalized.join(", ") : "None"
  );
  console.log(`[Reversed Solver] 🧮 Total Score: ${totalScore}`);
  console.log("[Reversed Solver] --------------------------------------------------");

  return {
    status: "checked",
    totalGroups: groups.length,
    totalAbilities: abilitySummary.length,
    penalized,
    totalScore,
  };
}
