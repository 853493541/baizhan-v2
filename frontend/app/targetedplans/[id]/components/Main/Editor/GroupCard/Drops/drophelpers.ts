import tradableAbilities from "@/app/data/tradable_abilities.json";
import { getBossProgress } from "@/utils/collectionUtils";

export const tradableSet = new Set(tradableAbilities as string[]);

/** 🌀 Variant (变招) abilities — excluded from collection/progress counting */
export const variantSet = new Set([
  "冲炎枪",
  "毒指功",
  "枪法蝮蛇",
  "蛮熊碎颅击",
  "水遁水流闪",
  "阴雷之种",
]);

export const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
]);

export const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

/**
 * 🧱 Build available drop options for this floor.
 * - Floors 81–90: only 九重 drops
 * - Floors 91–100: both 九重 and 十重
 * - Excludes tradable abilities
 */
export function buildOptions(dropList: string[], floor: number) {
  const untradables = dropList.filter((d) => !tradableSet.has(d));

  if (floor >= 81 && floor <= 90) {
    return untradables.map((d) => ({ ability: d, level: 9 as 9 }));
  }

  if (floor >= 91 && floor <= 100) {
    return untradables.flatMap((d) => [
      { ability: d, level: 9 as 9 },
      { ability: d, level: 10 as 10 },
    ]);
  }

  return [];
}

/**
 * 🎯 Tier-aware, gender-aware boss progress text.
 * Excludes tradable, variant (变招), and gender-locked abilities.
 * Example: "1/4 九重"
 */
export function getBossProgressText(
  dropList: string[],
  character: any,
  level?: number
): string {
  const abilities = character.abilities ?? {};
  const gender = character.gender || "男";

  // 💡 Gender-specific ability lockouts
  const maleOnly = ["顽抗", "巨猿劈山"];
  const femaleOnly = ["剑心通明"];

  // ✅ Exclude tradables, variants, and gender-locked abilities
  const filteredDrops = dropList.filter((ab) => {
    if (tradableSet.has(ab)) return false;
    if (variantSet.has(ab)) return false; // 🚫 变招不计入收集
    if (gender === "男" && femaleOnly.includes(ab)) return false;
    if (gender === "女" && maleOnly.includes(ab)) return false;
    return true;
  });

  const total = filteredDrops.length;

  // 🪶 If no tier specified, use the legacy boss progress for consistency
  if (!level) {
    return getBossProgress(filteredDrops, abilities, gender);
  }

  // ✅ Count only abilities ≥ current tier (九重 or 十重)
  const collected = filteredDrops.reduce((count, ab) => {
    const lv = abilities[ab] ?? 0;
    return lv >= level ? count + 1 : count;
  }, 0);

  // ✅ Use proper Chinese numeral label
  const tierLabel = level === 10 ? "十重" : "九重";

  // ✅ Compact display style
  return `${collected}/${total} ${tierLabel}`;
}
