/**
 * backend/game/engine/utils/combatMath.ts
 *
 * Pure combat math helpers.
 * - No state mutation
 * - No events
 * - Used by turnResolver & effect handlers
 */

export function resolveScheduledDamage(params: {
  source: { statuses: any[] };
  target: { statuses: any[] };
  base: number;
}) {
  let dmg = params.base;

  // DAMAGE MULTIPLIER (e.g. 女娲补天)
  const boost = params.source.statuses.find(
    (s) => s.type === "DAMAGE_MULTIPLIER"
  );
  if (boost) {
    dmg *= boost.value ?? 1;
  }

  // DAMAGE REDUCTION (e.g. 风袖低昂)
  const dr = params.target.statuses.find(
    (s) => s.type === "DAMAGE_REDUCTION"
  );
  if (dr) {
    dmg *= 1 - (dr.value ?? 0);
  }

  return Math.max(0, Math.floor(dmg));
}
