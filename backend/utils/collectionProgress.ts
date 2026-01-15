// backend/utils/collectionProgress.ts

export const genderRules = {
  男: { ignore: ["剑心通明", "帝骖龙翔"] },
  女: { ignore: ["巨猿劈山", "顽抗", "蛮熊碎颅击"] },
};

export function getNextTier(
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
): number {
  const ignoreList = genderRules[gender]?.ignore ?? [];
  const filtered = abilities.filter(a => !ignoreList.includes(a));
  const levels = filtered.map(a => characterAbilities[a] ?? 0);

  for (let tier = 1; tier <= 10; tier++) {
    if (!levels.every(lv => lv >= tier)) {
      return tier;
    }
  }
  return 10;
}

export function getMissingForNextTier(
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
): string[] {
  const nextTier = getNextTier(abilities, characterAbilities, gender);
  const ignoreList = genderRules[gender]?.ignore ?? [];
  const filtered = abilities.filter(a => !ignoreList.includes(a));
  return filtered.filter(a => (characterAbilities[a] ?? 0) < nextTier);
}
