// drops/drophelpers.ts
import tradableAbilities from "@/app/data/tradable_abilities.json";
import { getBossProgress } from "@/utils/collectionUtils";

export const tradableSet = new Set(tradableAbilities as string[]);

export const MAIN_CHARACTERS = new Set(["剑心猫猫糕", "东海甜妹", "饲猫大桔","五溪", "唐宵风"]);

export const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export const buildOptions = (dropList: string[], floor: number) => {
  const untradables = dropList.filter((d) => !tradableSet.has(d));
  if (floor >= 81 && floor <= 90)
    return untradables.map((d) => ({ ability: d, level: 9 as 9 }));
  if (floor >= 91 && floor <= 100)
    return untradables.flatMap((d) => [
      { ability: d, level: 9 as 9 },
      { ability: d, level: 10 as 10 },
    ]);
  return [];
};

export const getBossProgressText = (dropList: string[], character: any) =>
  getBossProgress(dropList, character.abilities, character.gender || "男");
