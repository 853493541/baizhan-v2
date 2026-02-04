// backend/game/engine/flow/applyEffects.ts

import { GameState, Card, CardEffect } from "../state/types";
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
  ========================================================= */
  source.buffs = source.buffs.filter((b) => !b.breakOnPlay);

  // Snapshot for bonus-damage checks (opponent HP at card start)
  const opponentHpAtCardStart = defaultTarget.hp;

  /* =========================================================
     card-level dodge (enemy effects only)
     - uses target's stacked DODGE_NEXT chance (buff effects)
  ========================================================= */
  const cardDodged =
    card.target === "OPPONENT" ? shouldDodge(defaultTarget) : false;

  /* =========================================================
     1) Apply immediate effects
  ========================================================= */
  for (const effect of card.effects) {
    const effTargetIndex = resolveEffectTargetIndex(
      targetIndex,
      playerIndex,
      effect.applyTo
    );

    const effTarget = state.players[effTargetIndex];

    // Enemy effect = actually applies to opponent (not caster)
    const enemyEffect = isEnemyEffect(source, effTarget, effect);

    // Dodge cancels enemy-applied effects only
    if (shouldSkipDueToDodge(cardDodged, enemyEffect)) {
      continue;
    }

    switch (effect.type) {
      case "DAMAGE": {
        handleDamage(state, source, effTarget, enemyEffect, card, effect);
        break;
      }

      case "BONUS_DAMAGE_IF_TARGET_HP_GT": {
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
         CHANNEL (legacy compatible)
      ========================================================= */
      case "FENGLAI_CHANNEL":
      case "WUJIAN_CHANNEL":
      case "XINZHENG_CHANNEL": {
        handleChannelEffect(state, source, enemy, card, effect);
        break;
      }

      default: {
        // If you still have durationTurns-only effects inside card.effects,
        // they should now be moved into card.buffs.
        // We'll keep a soft compatibility path:
        if (!effect.durationTurns) break;

        // block enemy-applied NEW buffs by untargetable
        if (blocksNewBuffByUntargetable(source, effTarget)) break;

        // control immunity blocks CONTROL
        if (blocksControlByImmunity(effect.type, effTarget)) break;

        // Legacy timed effects inside card.effects are NOT supported as statuses anymore.
        // Move them into card.buffs.
        break;
      }
    }
  }

  /* =========================================================
     2) Apply buffs defined on card (modern, intended path)
     - target determined by card.target (or effect.applyTo if you later extend)
  ========================================================= */
  {
    const buffTarget = card.target === "SELF" ? source : defaultTarget;
    const enemyEffect = buffTarget.userId !== source.userId;

    // Dodge also cancels enemy-applied buffs
    if (!shouldSkipDueToDodge(cardDodged, enemyEffect)) {
      // Untargetable blocks new enemy buffs
      if (!blocksNewBuffByUntargetable(source, buffTarget)) {
        handleApplyBuffs({
          state,
          card,
          source,
          target: buffTarget,
          isEnemyEffect: enemyEffect,
        });
      }
    }
  }

  /* =========================================================
     END GAME CHECK
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)?.userId;
    }
  }
}
