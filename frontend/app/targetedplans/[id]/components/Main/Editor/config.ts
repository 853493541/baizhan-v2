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

// ✅ Skip bossRecommendations safely
Object.entries(
  abilityGroups as Record<
    string,
    { abilities?: string[]; aliases?: Record<string, string> }
  >
).forEach(([group, data]) => {
  if (group === "bossRecommendations") return; // ⛔ skip this top-level section

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
    { abilities?: string[]; aliases?: Record<string, string> }
  >
).forEach(([group, data]) => {
  if (group === "bossRecommendations") return; // ⛔ skip again
  if (data.aliases) {
    Object.entries(data.aliases).forEach(([full, alias]) => {
      abilityAliases[full] = alias;
    });
  }
});

/* ----------------------------------------------------------------------
   🧠 Optional — Boss Recommendation Accessor
   ---------------------------------------------------------------------- */
export const bossRecommendations: Record<
  string,
  Record<string, string[]>
> = (abilityGroups as any).bossRecommendations || {};
