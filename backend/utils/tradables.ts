// backend/utils/tradables.ts

import bossData from "../data/boss_skills_collection_reward.json";
import tradableAbilities from "../data/tradable_abilities.json";
import {
  getNextTier,
  getMissingForNextTier,
} from "./collectionProgress";

interface CharacterLike {
  abilities?: Record<string, number>;
  gender: "男" | "女";
}

interface TradableAbility {
  ability: string;
  requiredLevel: number;
  currentLevel: number;
}

export function getTradables(character: CharacterLike): TradableAbility[] {
  const tradables: TradableAbility[] = [];
  const seen = new Set<string>();

  const owned = character.abilities ?? {};

  for (const abilities of Object.values(bossData) as string[][]) {
    const nextTier = getNextTier(abilities, owned, character.gender);
    const missing = getMissingForNextTier(abilities, owned, character.gender);

    if (!missing || missing.length === 0) continue;

    // ✅ ONLY TRADABLES LEFT
    const allMissingAreTradable = missing.every((a) =>
      tradableAbilities.includes(a)
    );
    if (!allMissingAreTradable) continue;

    for (const ability of missing) {
      if (seen.has(ability)) continue;
      seen.add(ability);

      tradables.push({
        ability,
        requiredLevel: nextTier,
        currentLevel: owned[ability] ?? 0, // ✅ NEW FIELD
      });
    }
  }

  return tradables;
}
