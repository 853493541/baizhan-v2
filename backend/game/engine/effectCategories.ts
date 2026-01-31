import { EffectCategory, EffectType } from "./types";

export const EFFECT_CATEGORY_MAP: Record<EffectType, EffectCategory> = {
  DAMAGE: "DEBUFF",
  HEAL: "BUFF",
  DRAW: "BUFF",
  CLEANSE: "BUFF",

  DAMAGE_REDUCTION: "BUFF",
  DAMAGE_MULTIPLIER: "BUFF",
  UNTARGETABLE: "BUFF",
  STEALTH: "BUFF",
  CONTROL_IMMUNE: "BUFF",
  DODGE_NEXT: "BUFF",
  START_TURN_HEAL: "BUFF",

  HEAL_REDUCTION: "DEBUFF",
  ATTACK_LOCK: "DEBUFF",
  SILENCE: "DEBUFF",
  DELAYED_DAMAGE: "DEBUFF",
  START_TURN_DAMAGE: "DEBUFF",
  CONTROL: "DEBUFF",

  // ✅ Channel buffs are BUFFs (self-cast)
  FENGLAI_CHANNEL: "BUFF",
  WUJIAN_CHANNEL: "BUFF",
};

export function getEffectCategory(type: EffectType): EffectCategory {
  return EFFECT_CATEGORY_MAP[type] ?? "BUFF";
}
