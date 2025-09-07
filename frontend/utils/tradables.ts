// frontend/utils/tradables.ts
import bossData from "@/app/data/boss_skills_collection_reward.json";
import tradableAbilities from "@/app/data/tradable_abilities.json";
import { getMissingForNextTier, getNextTier } from "@/utils/collectionUtils";
import { Character } from "@/types/Character";

export function getTradables(character: Character) {
  const tradables: { ability: string; requiredLevel: number }[] = [];

  for (const [_, abilities] of Object.entries(bossData)) {
    const nextTier = getNextTier(abilities, character.abilities || {}, character.gender);
    const missing = getMissingForNextTier(abilities, character.abilities || {}, character.gender);

    if (missing.length === 1 && tradableAbilities.includes(missing[0])) {
      tradables.push({ ability: missing[0], requiredLevel: nextTier });
    }
  }

  return tradables;
}
