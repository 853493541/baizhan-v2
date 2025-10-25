import abilityGroups from "../../../../../data/TargetedPlanUseAbilities.json";

// Main characters star
export const MAIN_CHARACTERS = new Set<string>([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

// Ability category colors
export const CATEGORY_COLORS: Record<string, string> = {
  purple: "#a678ff",
  yellow: "#ffe066",
  red: "#ff6b6b",
  blue: "#5cb7ff",
  green: "#74d39a",
  healer: "#ff9dd6",
};

// Build flat ability list + color map
export const abilityColorMap: Record<string, string> = {};
export const abilities: string[] = [];

Object.entries(abilityGroups as Record<string, string[]>).forEach(([group, list]) => {
  const color = CATEGORY_COLORS[group] || "#ddd";
  list.forEach((name) => {
    abilityColorMap[name] = color;
    abilities.push(name);
  });
});
