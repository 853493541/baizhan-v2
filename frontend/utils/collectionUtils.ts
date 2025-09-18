// utils/collectionUtils.ts

import tradableAbilities from "@/app/data/tradable_abilities.json";

export const genderRules = {
  男: { ignore: ["剑心通明", "帝骖龙翔"] },
  女: { ignore: ["巨猿劈山", "顽抗", "蛮熊碎颅击"] },
};

export const toChineseTier = (n: number) => {
  const numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return `${numerals[n]}重`;
};

/** —— 原有展示逻辑 —— */

export const getNextTier = (
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) => {
  const ignoreList = genderRules[gender].ignore;
  const filtered = abilities.filter((a) => !ignoreList.includes(a));
  const levels = filtered.map((a) => characterAbilities[a] || 0);

  for (let tier = 1; tier <= 10; tier++) {
    const allReached = levels.every((lv) => lv >= tier);
    if (!allReached) return tier;
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

/** —— 统计加成：修复比例命中 & 性别分配 —— */

// 规范化 Boss 名，解决“和/、”等写法差异
function normalizeBossName(name: string) {
  return name
    .replace("武逸青、胡鞑和萧沙", "武逸青、胡鞑、萧沙")
    .replace(/\s+/g, "");
}

// 静态比例（除性别分支的都写死）
const baseRatios: Record<string, [number, number]> = {
  华鹤炎: [0.3, 0.7],
  罗翼: [0.2, 0.8],
  冯度: [0.7, 0.3],
  鬼影小次郎: [0.7, 0.3],
  上衫勇刀: [0.2, 0.8],
  源明雅: [1, 0],
  方宇谦: [0.7, 0.3],
  肖童: [0.8, 0.2],
  秦雷: [0.3, 0.7],
  卫栖梧: [0.3, 0.7],
  牡丹: [0.8, 0.2],
  陆寻: [0.1, 0.9],
  谢云流: [0.5, 0.5],
  "武逸青、胡鞑、萧沙": [0.2, 0.8], // ✅ 修正键名，命中比例
  韦柔丝: [0.4, 0.6],
  程沐华: [0.8, 0.2],
  提多罗吒: [0.2, 0.8],
  阿基修斯: [0.5, 0.5],
  钱南撰: [0.4, 0.6],
  悉达罗摩: [0.7, 0.3],
  萧武宗: [0.4, 0.6],
  阿依努尔: [0.4, 0.6],
  司徒一一: [0.7, 0.3],
  迟驻: [0.6, 0.4],
  武雪散: [0.4, 0.6],
  公孙二娘: [0.8, 0.2],
  拓跋思南: [0.2, 0.8],
  青年谢云流: [0.5, 0.5],
};

// 性别分支比例：钱宗龙/杜姬欣
function getBossRatio(bossName: string, gender: "男" | "女"): [number, number] {
  const name = normalizeBossName(bossName);
  if (name === "钱宗龙、杜姬欣") {
    return gender === "女" ? [0.7, 0.3] : [0.3, 0.7];
  }
  return baseRatios[name] || [0.5, 0.5];
}

// 最低重数累计总额
const tierTotals: Record<number, number> = {
  1: 800,
  2: 1600,
  3: 2400,
  4: 3200,
  5: 4000,
  6: 5600,
  7: 8000,
  8: 12000,
  9: 18000,
  10: 27000,
};

// Rule 1：单 Boss 统计
export function calculateRule1(
  bossName: string,
  abilities: string[],
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) {
  const ignoreList = genderRules[gender].ignore;
  const filtered = abilities.filter((a) => !ignoreList.includes(a));
  const levels = filtered.map((a) => characterAbilities[a] || 0);

  if (levels.length === 0 || levels.some((lv) => lv === 0)) {
    return { energy: 0, durability: 0 };
  }

  const lowest = Math.min(...levels);
  const total = tierTotals[lowest] || 0;
  const [eRatio, dRatio] = getBossRatio(bossName, gender);

  return {
    energy: Math.round(total * eRatio),
    durability: Math.round(total * dRatio),
  };
}

// Rule 2：分档奖励（含向下覆盖，不去重）
const rule2Rewards: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 2000,
  6: 6000,
  7: 8000,
  8: 10000,
  9: 12000,
  10: 14000,
};

export function calculateRule2(characterAbilities: Record<string, number>) {
  let energy = 0;
  let durability = 0;
  for (let tier = 1; tier <= 10; tier++) {
    const count = Object.values(characterAbilities).filter((lv) => lv >= tier).length;
    if (count >= 3) {
      const r = rule2Rewards[tier] || 0;
      energy += r;
      durability += r;
    }
  }
  return { energy, durability };
}

// 总计算（含基础 10000/10000）
export function calculateStats(
  bosses: Record<string, string[]>,
  characterAbilities: Record<string, number>,
  gender: "男" | "女"
) {
  let energy = 10000;
  let durability = 10000;

  for (const [boss, abilities] of Object.entries(bosses)) {
    const { energy: e, durability: d } = calculateRule1(
      boss,
      abilities,
      characterAbilities,
      gender
    );
    energy += e;
    durability += d;
  }

  const { energy: r2e, durability: r2d } = calculateRule2(characterAbilities);
  energy += r2e;
  durability += r2d;

  return { energy, durability };
}
