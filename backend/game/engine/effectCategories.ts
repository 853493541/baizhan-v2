// backend/game/engine/effectCategories.ts
import { EffectCategory, EffectType } from "./types";

/**
 * Central source of truth:
 * categorize effect types into BUFF / DEBUFF for frontend UI styling.
 * (Game logic should NOT depend on this)
 */
export const EFFECT_CATEGORY_MAP: Record<EffectType, EffectCategory> = {
  // Instant effects (no duration) can still appear as Status in some designs,
  // but in our current engine they do not create Status unless durationTurns exists.
  DAMAGE: "DEBUFF",
  HEAL: "BUFF",
  DRAW: "BUFF",
  CLEANSE: "BUFF",

  // Timed BUFFs
  DAMAGE_REDUCTION: "BUFF",
  DAMAGE_MULTIPLIER: "BUFF",
  UNTARGETABLE: "BUFF",
  CONTROL_IMMUNE: "BUFF",
  DODGE_NEXT: "BUFF",
  START_TURN_HEAL: "BUFF",

  // Timed DEBUFFs
  HEAL_REDUCTION: "DEBUFF",
  ATTACK_LOCK: "DEBUFF",
  SILENCE: "DEBUFF",
  DELAYED_DAMAGE: "DEBUFF",
  START_TURN_DAMAGE: "DEBUFF",
};

export function getEffectCategory(type: EffectType): EffectCategory {
  return EFFECT_CATEGORY_MAP[type] ?? "BUFF";
}
