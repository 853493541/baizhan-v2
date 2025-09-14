// utils/genderCheck.ts

// Abilities restricted by gender
const maleOnly = new Set(["巨猿劈山", "蛮熊碎颅击"]);
const femaleOnly = new Set(["剑心通明", "帝骖龙翔"]);

import type { Character } from "@/utils/solver"; // adjust path if needed

// Check if a character can use an ability based on gender
export function canUseAbility(char: Character & { gender?: string }, ability: string): boolean {
  const g = char.gender; // "男" | "女" | undefined

  if (maleOnly.has(ability)) {
    return g === "男";
  }
  if (femaleOnly.has(ability)) {
    return g === "女";
  }
  return true; // default: usable
}
