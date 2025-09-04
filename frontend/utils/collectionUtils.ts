// utils/collectionUtils.ts

import tradableAbilities from "@/app/data/tradable_abilities.json";

export const genderRules = {
  男: { ignore: ["剑心通明", "帝骖龙翔"] },
  女: { ignore: ["巨猿劈山", "顽抗"] },
};

export const toChineseTier = (n: number) => {
  const numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return `${numerals[n]}重`;
};

export const getNextTier = (
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) => {
  const ignoreList = genderRules[gender].ignore;
  const filtered = abilities.filter((a) => !ignoreList.includes(a));
  const levels = filtered.map((a) => characterAbilities[a] || 0);

  let nextTier = 1;
  for (let tier = 1; tier <= 10; tier++) {
    const allReached = levels.every((lv) => lv >= tier);
    if (!allReached) {
      return tier;
    }
  }
  return 10;
};

export const getMissingForNextTier = (
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) => {
  const nextTier = getNextTier(abilities, characterAbilities, gender);
  const ignoreList = genderRules[gender].ignore;
  const filtered = abilities.filter((a) => !ignoreList.includes(a));
  return filtered.filter((a) => (characterAbilities[a] || 0) < nextTier);
};

export const getBossProgress = (
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) => {
  const nextTier = getNextTier(abilities, characterAbilities, gender);
  const ignoreList = genderRules[gender].ignore;
  const filtered = abilities.filter((a) => !ignoreList.includes(a));
  const owned = filtered.filter((a) => (characterAbilities[a] || 0) >= nextTier).length;
  return `${owned}/${filtered.length} ${toChineseTier(nextTier)}`;
};

export const getTradableShortcut = (
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) => {
  const missing = getMissingForNextTier(abilities, characterAbilities, gender);
  return missing.find((a) => tradableAbilities.includes(a)) || null;
};
