import { GroupResult, AbilityCheck } from "@/utils/solver";

// Hardcoded rerun counter (avoid infinite loops)
const rerunCount: Record<string, number> = {};

const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

// Abilities for "effective use" check
const SPECIAL_ABILITIES = ["引燃", "黑煞落贪狼"];

export async function checkAndRerun(
  groups: GroupResult[],
  {
    solving,
    runSolver,
    scheduleId,
  }: {
    solving: boolean;
    runSolver: (abilities: AbilityCheck[], label: string) => Promise<void>;
    scheduleId: string;
  },
  coreAbilities: AbilityCheck[]
) {
  if (groups.length === 0) {
    console.log(`[RERUN] Skipped: no groups present.`);
    return;
  }
  if (solving) {
    console.log(`[RERUN] Skipped: solver already running.`);
    return;
  }

  // Init rerun counter
  if (!(scheduleId in rerunCount)) rerunCount[scheduleId] = 0;

  // Max retries check
  if (rerunCount[scheduleId] >= 5) {
    console.warn(`[RERUN] Max attempts (5) reached for schedule ${scheduleId}. No further reruns.`);
    return;
  }

  // ---------- RULE 1: Main character duplication ----------
  const hasMainConflict = groups.some(
    (g) => g.characters.filter((c) => MAIN_CHARACTERS.has(c.name)).length > 1
  );

  if (hasMainConflict) {
    rerunCount[scheduleId]++;
    console.warn(
      `[RERUN] Rule 1 triggered (multiple main characters). Rerun #${rerunCount[scheduleId]}`
    );
    await runSolver(coreAbilities, `Core 8 (rerun #${rerunCount[scheduleId]})`);
    return;
  } else {
    console.log("[RERUN] Rule 1 passed (no main char conflicts).");
  }

  // ---------- RULE 2: Effective use of special abilities ----------
  const groupCount = groups.length;

  for (const abilityName of SPECIAL_ABILITIES) {
    const totalLevel10 = groups.reduce(
      (sum, g) =>
        sum +
        g.characters.filter((c) => c.abilities?.[abilityName] === 10).length,
      0
    );

    if (totalLevel10 > groupCount / 2 && totalLevel10 < groupCount) {
      // Case A: More than half but not enough for all
      const badDistribution = groups.some(
        (g) => g.characters.filter((c) => c.abilities?.[abilityName] === 10).length > 1
      );
      if (badDistribution) {
        rerunCount[scheduleId]++;
        console.warn(
          `[RERUN] Rule 2 triggered (${abilityName} uneven, not enough for all). Rerun #${rerunCount[scheduleId]}`
        );
        await runSolver(coreAbilities, `Core 8 (rerun #${rerunCount[scheduleId]})`);
        return;
      } else {
        console.log(`[RERUN] Rule 2 checked (${abilityName}): distribution okay (not enough for all).`);
      }
    } else if (totalLevel10 === groupCount) {
      // Case B: Exactly equal to group count → must be evenly distributed
      const badDistribution = groups.some(
        (g) => g.characters.filter((c) => c.abilities?.[abilityName] === 10).length !== 1
      );
      if (badDistribution) {
        rerunCount[scheduleId]++;
        console.warn(
          `[RERUN] Rule 2 triggered (${abilityName} should be 1 per group). Rerun #${rerunCount[scheduleId]}`
        );
        await runSolver(coreAbilities, `Core 8 (rerun #${rerunCount[scheduleId]})`);
        return;
      } else {
        console.log(`[RERUN] Rule 2 checked (${abilityName}): perfect distribution.`);
      }
    } else {
      console.log(`[RERUN] Rule 2 skipped for ${abilityName}: total ${totalLevel10}, groups ${groupCount}.`);
    }
  }

  console.log("[RERUN] No rerun triggered this cycle.");
}
