import { Character } from "@/types/Character";

/**
 * ✅ Detect abilities that can be "read" from backpack (storage)
 * Rules:
 * - storage contains { ability, level }
 * - include only if storage.level === 10
 * - include only if character's ability === 9
 * - ignore all others
 */
export function getReadableFromStorage(character: Character) {
  if (!character?.storage || !Array.isArray(character.storage)) return [];

  const currentAbilities = character.abilities || {};

  return character.storage
    .filter((item) => item && item.level === 10)
    .filter((item) => {
      const currentLevel = currentAbilities[item.ability] || 0;
      return currentLevel === 9; // ✅ only warn when exactly Lv9
    })
    .map((item) => ({
      ability: item.ability,
      fromLevel: 9,
      storedLevel: 10,
    }));
}
