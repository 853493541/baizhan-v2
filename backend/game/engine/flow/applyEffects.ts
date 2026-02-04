// backend/game/engine/flow/applyEffects.ts
/**
 * Orchestrator for card effect execution.
 *
 * Responsibilities:
 * - High-level flow of applying a card
 * - breakOnPlay cleanup (caster only)
 * - card-level dodge computation
 * - Iterating card.effects (immediate effects only)
 * - Applying card.buffs (persistent buffs)
 * - End-game check
 *
 * IMPORTANT:
 * - No effect math here (delegated to handlers / utils)
 * - No buff creation rules here (delegated to handleApplyBuffs)
 * - Behavior should stay compatible with legacy rules:
 *   - Dodge cancels enemy-applied stuff only
 *   - Untargetable blocks enemy-applied NEW buffs
 *   - Control immunity blocks CONTROL (handled by guards/handler)
 */

import { GameState, Card } from "../state/types";
import { getEnemy, resolveEffectTargetIndex } from "../utils/targeting";

import {
  isEnemyEffect,
  shouldSkipDueToDodge,
  blocksNewBuffByUntargetable,
  blocksControlByImmunity,
  shouldDodge,
} from "../rules/guards";

import {
  handleDamage,
  handleBonusDamageIfHpGt,
  handleHeal,
  handleDraw,
  handleCleanse,
  handleChannelEffect,
  handleApplyBuffs,
} from "../effects/handlers";

export function applyEffects(
  state: GameState,
  card: Card,
  playerIndex: number,
  targetIndex: number
) {
  if (state.gameOver) return;

  const source = state.players[playerIndex];
  const defaultTarget = state.players[targetIndex];
  const enemy = getEnemy(state, playerIndex);

  /* =========================================================
     breakOnPlay affects ONLY the caster
     - your buff ends when YOU cast
     - enemy casting does NOT break your buffs
  ========================================================= */
  source.buffs = source.buffs.filter((b) => !b.breakOnPlay);

  // Snapshot for bonus-damage checks (opponent HP at card start)
  const opponentHpAtCardStart = defaultTarget.hp;

  /* =========================================================
     card-level dodge (enemy effects only)
     - Only relevant when the card targets opponent
     - Uses target's stacked DODGE_NEXT from buffs
  ========================================================= */
  const cardDodged = card.target === "OPPONENT" ? shouldDodge(defaultTarget) : false;

  /* =========================================================
     1) Apply immediate effects (card.effects)
     - These should be ONLY instant effects now
  ========================================================= */
  for (const effect of card.effects) {
    const effTargetIndex = resolveEffectTargetIndex(
      targetIndex,
      playerIndex,
      effect.applyTo
    );
    const effTarget = state.players[effTargetIndex];

    const enemyApplied = isEnemyEffect(source, effTarget, effect);

    // Dodge cancels enemy-applied effects only
    if (shouldSkipDueToDodge(cardDodged, enemyApplied)) continue;

    switch (effect.type) {
      case "DAMAGE": {
        handleDamage(state, source, effTarget, enemyApplied, card, effect);
        break;
      }

      case "BONUS_DAMAGE_IF_TARGET_HP_GT": {
        // this effect is always about the opponent target snapshot
        handleBonusDamageIfHpGt(
          state,
          source,
          defaultTarget,
          opponentHpAtCardStart,
          card,
          effect
        );
        break;
      }

      case "HEAL": {
        handleHeal(state, source, effTarget, card, effect);
        break;
      }

      case "DRAW": {
        handleDraw(state, source, effect);
        break;
      }

      case "CLEANSE": {
        handleCleanse(source);
        break;
      }

      /* =========================================================
         CHANNEL (legacy compatible path)
         - Some old cards might still use these as immediate “cast” triggers
         - Preferred design now: put CHANNEL into card.buffs
      ========================================================= */
      case "FENGLAI_CHANNEL":
      case "WUJIAN_CHANNEL":
      case "XINZHENG_CHANNEL": {
        handleChannelEffect(state, source, enemy, card, effect);
        break;
      }

      default: {
        // Compatibility: timed effects in card.effects are deprecated.
        // They must be moved into card.buffs.
        // We deliberately do nothing here to avoid “ghost statuses”.
        break;
      }
    }
  }

  /* =========================================================
     2) Apply buffs defined on card (card.buffs)
     - Target determined by card.target (SELF / OPPONENT)
     - Dodge cancels enemy-applied buffs
     - Untargetable blocks enemy-applied NEW buffs
  ========================================================= */
  if (Array.isArray(card.buffs) && card.buffs.length > 0) {
    const buffTarget = card.target === "SELF" ? source : defaultTarget;
    const enemyApplied = buffTarget.userId !== source.userId;

    // Dodge cancels enemy-applied buffs only
    if (!shouldSkipDueToDodge(cardDodged, enemyApplied)) {
      // Untargetable blocks new enemy buffs
      if (!blocksNewBuffByUntargetable(source, buffTarget)) {
        // If buff contains CONTROL, control-immunity should block that portion.
        // We allow the handler to apply per-effect rules, but we keep a fast guard:
        // (handler should still enforce correctly even if this guard is removed)
        const hasControl = card.buffs.some((b) =>
          b.effects.some((e) => e.type === "CONTROL")
        );
        if (!(hasControl && blocksControlByImmunity("CONTROL", buffTarget))) {
          handleApplyBuffs({
            state,
            card,
            source,
            target: buffTarget,
            isEnemyEffect: enemyApplied,
          });
        }
      }
    }
  }

  /* =========================================================
     END GAME CHECK (unchanged)
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)?.userId;
      return;
    }
  }
}
