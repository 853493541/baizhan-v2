/**
 * backend/game/engine/rules/guards.ts
 *
 * Rule guards that decide whether an effect:
 * - applies
 * - is blocked
 * - is skipped
 *
 * ❗ No state mutation
 * ❗ No events
 */

import { Status, EffectType } from "../state/types";

/* =========================================================
   BASIC STATUS GUARDS
========================================================= */

/**
 * Dodge check
 * - stacks chance from multiple DODGE_NEXT statuses
 * - probabilistic
 */
export function shouldDodge(target: { statuses: Status[] }) {
  const chance = target.statuses
    .filter((s) => s.type === "DODGE_NEXT")
    .reduce((sum, s) => sum + (s.chance ?? 0), 0);

  if (chance <= 0) return false;
  return Math.random() < chance;
}

/**
 * Untargetable guard
 */
export function hasUntargetable(target: { statuses: Status[] }) {
  return target.statuses.some((s) => s.type === "UNTARGETABLE");
}

/* =========================================================
   EFFECT TARGETING RULES
========================================================= */

/**
 * Effects that are ALWAYS self-side,
 * regardless of card.target
 */
export function isAlwaysSelfEffect(effectType: EffectType) {
  return (
    effectType === "DRAW" ||
    effectType === "CLEANSE" ||
    effectType === "FENGLAI_CHANNEL" ||
    effectType === "WUJIAN_CHANNEL" ||
    effectType === "XINZHENG_CHANNEL"
  );
}

/**
 * Determines whether an effect is applied to the enemy
 */
export function isEnemyEffect(
  source: { userId: string },
  target: { userId: string },
  effect: { type: EffectType }
) {
  if (isAlwaysSelfEffect(effect.type)) return false;
  return target.userId !== source.userId;
}

/* =========================================================
   SKIP / BLOCK LOGIC
========================================================= */

/**
 * Skip logic due to dodge
 * - dodge only cancels enemy-applied effects
 */
export function shouldSkipDueToDodge(
  cardDodged: boolean,
  isEnemyEffect: boolean
) {
  if (!cardDodged) return false;
  if (!isEnemyEffect) return false;
  return true;
}

/**
 * Untargetable blocks NEW enemy-applied statuses
 */
export function blocksNewStatusByUntargetable(
  source: { userId: string },
  target: { userId: string; statuses: Status[] }
) {
  return target.userId !== source.userId && hasUntargetable(target);
}

/**
 * Control immunity blocks CONTROL effects only
 */
export function blocksControlByImmunity(
  effectType: EffectType,
  target: { statuses: Status[] }
) {
  if (effectType !== "CONTROL") return false;
  return target.statuses.some((s) => s.type === "CONTROL_IMMUNE");
}
