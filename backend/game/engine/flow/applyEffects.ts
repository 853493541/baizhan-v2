// backend/game/engine/flow/applyEffects.ts
/**
 * Orchestrator for card effect execution.
 *
 * Responsibilities:
 * - High-level flow of applying a card
 * - breakOnPlay cleanup (caster only)
 * - card-level dodge computation
 * - Iterating card.effects
 * - Delegating guards + handlers
 * - End-game check
 *
 * IMPORTANT:
 * - Contains NO effect math (delegated to handlers / utils)
 * - Contains NO status creation rules except calling addStatus
 * - Behavior must remain identical to original monolith
 */

import { GameState, Card } from "../state/types";

import { getEnemy, resolveEffectTargetIndex } from "../utils/targeting";

import {
  isEnemyEffect,
  shouldSkipDueToDodge,
  blocksNewStatusByUntargetable,
  blocksControlByImmunity,
} from "../rules/guards";

import {
  handleDamage,
  handleBonusDamageIfHpGt,
  handleHeal,
  handleDraw,
  handleCleanse,
  handleChannelEffect,
} from "../effects/handlers";

import { addStatus } from "../effects/system";

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
     FIX #1 (kept): breakOnPlay affects ONLY the caster
     - breakOnPlay is "your effect ends when YOU cast"
     - enemy casting should NOT break your statuses
  ========================================================= */
  source.statuses = source.statuses.filter((s) => !s.breakOnPlay);

  // Snapshot for bonus-damage checks (opponent HP at card start)
  const opponentHpAtCardStart = defaultTarget.hp;

  /* =========================================================
     PATCH 0.3.1 — card-level dodge (enemy effects only)
     - Only applies when the card targets opponent
     - Uses target's stacked DODGE_NEXT chance
     - Cancels enemy-applied effects only (self-side effects must still happen)
  ========================================================= */
  const cardDodged =
    card.target === "OPPONENT" &&
    (() => {
      const chance = defaultTarget.statuses
        .filter((s) => s.type === "DODGE_NEXT")
        .reduce((sum, s) => sum + (s.chance ?? 0), 0);

      return chance > 0 && Math.random() < chance;
    })();

  for (const effect of card.effects) {
    const effTargetIndex = resolveEffectTargetIndex(
      targetIndex,
      playerIndex,
      effect.applyTo
    );

    const effTarget = state.players[effTargetIndex];

    // Enemy effect = actually applies to opponent (not caster)
    const enemyEffect = isEnemyEffect(source, effTarget, effect);

    // Dodge cancels enemy-applied effects only (kept behavior)
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
         CHANNEL BUFFS (self-cast)
         - handler must preserve original behavior:
           FENGLAI: add status + immediate 10 dmg to enemy (untargetable immune) (dodge applies)
           WUJIAN : add status + immediate 10 dmg to enemy (untargetable immune) (dodge applies)
                   + immediate self heal 3
           XINZHENG: add status only
      ========================================================= */
      case "FENGLAI_CHANNEL":
      case "WUJIAN_CHANNEL":
      case "XINZHENG_CHANNEL": {
        handleChannelEffect(state, source, enemy, card, effect);
        break;
      }

      default: {
        // timed status effects
        if (!effect.durationTurns) break;

        // ✅ UNTARGETABLE blocks enemy-applied NEW status effects
        // ✅ CONTROL immunity blocks CONTROL
        if (
          blocksNewStatusByUntargetable(source, effTarget) ||
          blocksControlByImmunity(effect.type, effTarget)
        ) {
          break;
        }

        addStatus({
          state,
          sourceUserId: source.userId,
          targetUserId: effTarget.userId,
          card,
          statusTarget: effTarget,
          type: effect.type,
          value: effect.value,
          durationTurns: effect.durationTurns,
          repeatTurns: effect.repeatTurns,
          chance: effect.chance,
          breakOnPlay: effect.breakOnPlay,
        });

        break;
      }
    }
  }

  /* =========================================================
     END GAME CHECK (unchanged)
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)
        ?.userId;
    }
  }
}
