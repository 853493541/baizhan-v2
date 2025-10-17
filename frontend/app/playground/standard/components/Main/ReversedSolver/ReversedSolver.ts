/**
 * ReversedSolver.ts
 * -----------------------------
 * Checks core abilities first, then non-core abilities.
 * Core abilities are level-sensitive.
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

  // 🟢 Separate core and non-core abilities
  const coreList = abilitySummary.filter((a) => coreAbilities.includes(a.ability));
  const otherList = abilitySummary.filter((a) => !coreAbilities.includes(a.ability));

  // 🔍 Helper to check one ability
  const checkAbility = (a: AbilitySummary, isCore: boolean) => {
    const abilityName = a.ability;

    const groupNeedCount = groups.reduce((count, g) => {
      const hasNeed = g.members.some((m) =>
        m.needs?.some((n) => `${n.name}${n.level}` === abilityName)
      );
      return count + (hasNeed ? 1 : 0);
    }, 0);

    const mark = groupNeedCount < a.neededGroups ? "❌" : "✅";
    if (mark === "❌") penalized.push(abilityName);

    const tag = isCore ? "(CORE)" : "";
    console.log(
      `[Reversed Solver] ${abilityName.padEnd(12)} ${String(
        groupNeedCount
      ).padStart(2)}/${a.neededGroups}  → ${mark} ${tag}`
    );
  };

  // ✅ Check all core abilities first
  coreList.forEach((a) => checkAbility(a, true));

  // 🟡 Then check the rest
  otherList.forEach((a) => checkAbility(a, false));

  console.log("--------------------------------------------------");
  console.log(
    `[Reversed Solver] ✅ Check Complete. Penalized (${penalized.length}):`,
    penalized.length > 0 ? penalized.join(", ") : "None"
  );
  console.log("[Reversed Solver] --------------------------------------------------");

  return {
    status: "checked",
    totalGroups: groups.length,
    totalAbilities: abilitySummary.length,
    penalized,
  };
}
