// frontend/utils/tradables.ts
import bossData from "@/app/data/boss_skills_collection_reward.json";
import tradableAbilities from "@/app/data/tradable_abilities.json";
import { getMissingForNextTier, getNextTier } from "@/utils/collectionUtils";
import { Character } from "@/types/Character";

export function getTradables(character: Character) {
  const tradables: { ability: string; requiredLevel: number }[] = [];
  const seen = new Set<string>(); // prevent duplicates across bosses/entries

  const owned = character.abilities || {};

  for (const abilities of Object.values(bossData)) {
    const nextTier = getNextTier(abilities, owned, character.gender);
    const missing = getMissingForNextTier(abilities, owned, character.gender);

    // Nothing missing => nothing to buy
    if (!missing || missing.length === 0) continue;

    // ✅ KEY RULE:
    // Only show tradables when ALL remaining missing abilities are tradable.
    // (i.e., "ONLY TRADABLES LEFT")
    const allMissingAreTradable = missing.every((a) => tradableAbilities.includes(a));
    if (!allMissingAreTradable) continue;

    // At this point, missing contains only tradable abilities (could be 1 or more)
    for (const ability of missing) {
      if (seen.has(ability)) continue;
      seen.add(ability);

      tradables.push({
        ability,
        requiredLevel: nextTier,
      });
    }
  }

  return tradables;
}
