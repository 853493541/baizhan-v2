import { GroupResult, AbilityCheck } from "./solver";
import { getDefaultAbilityPool } from "./playgroundHelpers";
import tradableAbilities from "@/app/data/tradable_abilities.json"; // ✅ import tradables

// ✅ Async aftermath summary aligned with advanced solver filtering
export async function summarizeAftermath(groups: GroupResult[]) {
  // 1️⃣ Fetch full weekly pool
  const pool: AbilityCheck[] = await getDefaultAbilityPool();

  // 2️⃣ Exclude tradables (same logic as AdvancedGroups & solver)
  const targeted: AbilityCheck[] = pool
    .filter((a) => !tradableAbilities.includes(a.name))
    .map((a) => ({ ...a, available: true }));

  // 🔍 Debug logs
  // console.log(`[function:aftermath] full pool count = ${pool.length}`);
  // console.log(`[function:aftermath] after removing tradables = ${targeted.length}`);

  // 3️⃣ Analyze wasted abilities
  const globalWasted9: string[] = [];
  const globalWasted10: string[] = [];

  groups.forEach((g) => {
    const abilityPresence = new Map<string, number>();
    const charCount = g.characters.length;

    for (const c of g.characters) {
      for (const a of targeted) {
        if ((c.abilities?.[a.name] ?? 0) >= a.level) {
          const key = `${a.name}-${a.level}`;
          abilityPresence.set(key, (abilityPresence.get(key) ?? 0) + 1);
        }
      }
    }

    for (const [key, count] of abilityPresence.entries()) {
      if (count === charCount) {
        const [name, levelStr] = key.split("-");
        if (levelStr === "9") globalWasted9.push(name);
        if (levelStr === "10") globalWasted10.push(name);
      }
    }
  });

  return {
    wasted9: globalWasted9.length,
    wasted10: globalWasted10.length,
  };
}
