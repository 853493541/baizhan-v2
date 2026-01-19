import { canUseAbility } from "@/utils/genderCheck";
import tradableAbilities from "@/app/data/tradable_abilities.json";

const TRADABLE_SET = new Set<string>(tradableAbilities);

export function calcBossNeeds({
  boss,
  bossData,
  group,
  activeMembers,
  dropLevel,
  highlightAbilities,
}: {
  boss: string;
  bossData: Record<string, string[]>;
  group: any;
  activeMembers: number[];
  dropLevel: 9 | 10;
  highlightAbilities: string[];
}) {
  // Raw boss drop list
  const fullDropList = bossData[boss] || [];

  // ✅ HARD FILTER: remove tradables from needs
  const filteredDropList = fullDropList.filter(
    (ability) => !TRADABLE_SET.has(ability)
  );

  const healerAbilities = ["万花金创药", "特制金创药", "毓秀灵药", "霞月长针","陀罗曲静壁","特制止血钳","云海听弦"];

  const includedChars = (group?.characters || []).filter(
    (_: any, i: number) => activeMembers.includes(i)
  );

  const needs = filteredDropList
    .map((ability) => {
      const needers = includedChars.filter((c: any) => {
        const lvl = c.abilities?.[ability] ?? 0;
        return canUseAbility(c, ability) && lvl < dropLevel;
      });

      if (needers.length === 0) return null;

      const isHighlightBase = highlightAbilities.includes(ability);
      let isHighlight = isHighlightBase;

      // healer-only highlight rule
      if (isHighlightBase && healerAbilities.includes(ability)) {
        isHighlight = needers.some(
          (c: any) => c.role?.toLowerCase() === "healer"
        );
      }

      return {
        ability,
        needCount: needers.length,
        isHighlight,
      };
    })
    .filter(Boolean) as {
    ability: string;
    needCount: number;
    isHighlight: boolean;
  }[];

  // Highlighted abilities first
  needs.sort((a, b) =>
    a.isHighlight === b.isHighlight ? 0 : a.isHighlight ? -1 : 1
  );

  return needs;
}
