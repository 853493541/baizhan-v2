import abilityGroups from "../../../../../data/TargetedPlanUseAbilities.json";

/* ----------------------------------------------------------------------
   🌟 Main Character Names
   ---------------------------------------------------------------------- */
export const MAIN_CHARACTERS = new Set<string>([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

/* ----------------------------------------------------------------------
   🎨 Category Color Map (consistent across app)
   ---------------------------------------------------------------------- */
export const CATEGORY_COLORS: Record<string, string> = {
  purple: "#a678ff",
  yellow: "#ffe066",
  red: "#ff6b6b",
  blue: "#5cb7ff",
  green: "#74d39a",
  healer: "#ff9dd6",
};

/* ----------------------------------------------------------------------
   🧩 Flattened Ability Data (built dynamically from JSON)
   ---------------------------------------------------------------------- */
export const abilityColorMap: Record<string, string> = {};
export const abilities: string[] = [];

// ✅ Adapted for new nested structure (with abilities + aliases)
Object.entries(
  abilityGroups as Record<
    string,
    { abilities: string[]; aliases?: Record<string, string> }
  >
).forEach(([group, data]) => {
  const color = CATEGORY_COLORS[group] || "#ddd";
  (data.abilities || []).forEach((name) => {
    abilityColorMap[name] = color;
    abilities.push(name);
  });
});

/* ----------------------------------------------------------------------
   🈶 Optional — Alias Accessor (useful if others need aliases globally)
   ---------------------------------------------------------------------- */
export const abilityAliases: Record<string, string> = {};

Object.entries(
  abilityGroups as Record<
    string,
    { abilities: string[]; aliases?: Record<string, string> }
  >
).forEach(([_, data]) => {
  if (data.aliases) {
    Object.entries(data.aliases).forEach(([full, alias]) => {
      abilityAliases[full] = alias;
    });
  }
});
