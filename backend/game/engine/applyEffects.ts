// backend/game/engine/applyEffects.ts

import { randomUUID } from "crypto";
import {
  GameState,
  Card,
  Status,
  GameEvent,
  EffectType,
  TargetType,
} from "./types";
import { getEffectCategory } from "./effectCategories";

function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
}

function getEnemy(state: GameState, playerIndex: number) {
  return state.players[playerIndex === 0 ? 1 : 0];
}

function resolveEffectTargetIndex(
  cardTargetIndex: number,
  playerIndex: number,
  applyTo: TargetType | undefined
) {
  if (!applyTo) return cardTargetIndex;
  return applyTo === "SELF" ? playerIndex : playerIndex === 0 ? 1 : 0;
}

function addStatus(params: {
  state: GameState;
  sourceUserId: string;
  targetUserId: string;
  card: Card;
  statusTarget: { userId: string; statuses: Status[] };
  type: EffectType;
  value?: number;
  durationTurns: number;
  repeatTurns?: number;
  chance?: number;
  breakOnPlay?: boolean;
}) {
  const {
    state,
    sourceUserId,
    targetUserId,
    card,
    statusTarget,
    type,
    value,
    durationTurns,
    repeatTurns,
    chance,
    breakOnPlay,
  } = params;

  // refresh same-type
  statusTarget.statuses = statusTarget.statuses.filter((s) => s.type !== type);

  // IMPORTANT:
  // keep your old expire rule:
  // keep status if state.turn < expiresAtTurn
  // So creation must be: + durationTurns + 1
  const status: Status = {
    type,
    value,
    appliedAtTurn: state.turn,
    expiresAtTurn: state.turn + durationTurns + 1,
    repeatTurns,
    chance,
    breakOnPlay,
    sourceCardId: card.id,
    sourceCardName: card.name,
    category: getEffectCategory(type),
  };

  statusTarget.statuses.push(status);

  pushEvent(state, {
    turn: state.turn,
    type: "STATUS_APPLIED",
    actorUserId: sourceUserId,
    targetUserId,
    cardId: card.id,
    cardName: card.name,
    statusType: type,
    appliedAtTurn: status.appliedAtTurn,
    expiresAtTurn: status.expiresAtTurn,
  });
}

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
     ✅ FIX #1 (kept): breakOnPlay MUST only affect the player who PLAYED a card.
     - breakOnPlay is "your effect ends when YOU cast"
     - enemy casting should NOT break your statuses
  ========================================================= */
  source.statuses = source.statuses.filter((s) => !s.breakOnPlay);

  // For bonus-damage checks we want the "opponent HP at card start"
  const opponentHpAtCardStart = defaultTarget.hp;

  for (const effect of card.effects) {
    const effTargetIndex = resolveEffectTargetIndex(
      targetIndex,
      playerIndex,
      effect.applyTo
    );

    const effTarget = state.players[effTargetIndex];

    switch (effect.type) {
      case "DAMAGE": {
        let damage = effect.value ?? 0;

        // damage multiplier on source
        const boost = source.statuses.find((s) => s.type === "DAMAGE_MULTIPLIER");
        if (boost) damage *= boost.value ?? 1;

        // dodge check on target (PATCH 0.3)
      const dodgeChance = effTarget.statuses
  .filter((s) => s.type === "DODGE_NEXT")
  .reduce((sum, s) => sum + (s.chance ?? 0), 0);

if (dodgeChance > 0) {
  const roll = Math.random();
  if (roll < dodgeChance) {
    // fully dodged — no damage, no consume
    pushEvent(state, {
      turn: state.turn,
      type: "DAMAGE",
      actorUserId: source.userId,
      targetUserId: effTarget.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "DAMAGE",
      value: 0,
    });
    break;
  }
}

        // damage reduction on target
        const dr = effTarget.statuses.find((s) => s.type === "DAMAGE_REDUCTION");
        if (dr) damage *= 1 - (dr.value ?? 0);

        const final = Math.floor(damage);
        if (final > 0) {
          effTarget.hp = Math.max(0, effTarget.hp - final);
          pushEvent(state, {
            turn: state.turn,
            type: "DAMAGE",
            actorUserId: source.userId,
            targetUserId: effTarget.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "DAMAGE",
            value: final,
          });
        }
        break;
      }

      case "BONUS_DAMAGE_IF_TARGET_HP_GT": {
        // PATCH 0.3: intended for 追命箭
        const threshold = effect.threshold ?? 0;
        const bonus = effect.value ?? 0;

        // only makes sense if card was targeting opponent (your card design)
        // we use the default opponent HP snapshot at card start
        if (opponentHpAtCardStart > threshold && bonus > 0) {
          // apply to the default opponent target (NOT self)
          const t = defaultTarget;

          // dodge applies too
       const dodgeChance = t.statuses
  .filter((s) => s.type === "DODGE_NEXT")
  .reduce((sum, s) => sum + (s.chance ?? 0), 0);

if (dodgeChance > 0) {
  const roll = Math.random();
  if (roll < dodgeChance) {
    pushEvent(state, {
      turn: state.turn,
      type: "DAMAGE",
      actorUserId: source.userId,
      targetUserId: t.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "DAMAGE",
      value: 0,
    });
    break;
  }
}


          let damage = bonus;

          const boost = source.statuses.find((s) => s.type === "DAMAGE_MULTIPLIER");
          if (boost) damage *= boost.value ?? 1;

          const dr = t.statuses.find((s) => s.type === "DAMAGE_REDUCTION");
          if (dr) damage *= 1 - (dr.value ?? 0);

          const final = Math.floor(damage);
          if (final > 0) {
            t.hp = Math.max(0, t.hp - final);
            pushEvent(state, {
              turn: state.turn,
              type: "DAMAGE",
              actorUserId: source.userId,
              targetUserId: t.userId,
              cardId: card.id,
              cardName: card.name,
              effectType: "DAMAGE",
              value: final,
            });
          }
        }
        break;
      }

      case "HEAL": {
        let heal = effect.value ?? 0;

        // heal reduction must apply on the RECIPIENT (not always source)
        const hr = effTarget.statuses.find((s) => s.type === "HEAL_REDUCTION");
        if (hr) heal *= 1 - (hr.value ?? 0);

        const final = Math.floor(heal);

        const before = effTarget.hp;
        effTarget.hp = Math.min(100, effTarget.hp + final);

        const applied = Math.max(0, effTarget.hp - before);
        if (applied > 0) {
          pushEvent(state, {
            turn: state.turn,
            type: "HEAL",
            actorUserId: source.userId,
            targetUserId: effTarget.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "HEAL",
            value: applied,
          });
        }
        break;
      }

      case "DRAW": {
        // draw always goes to source (your system)
        for (let i = 0; i < (effect.value ?? 0); i++) {
          const c = state.deck.shift();
          if (c) source.hand.push(c);
        }
        break;
      }

      case "CLEANSE": {
        // cleanse on source (your system)
        source.statuses = source.statuses.filter((s) => s.type !== "CONTROL");
        break;
      }

      /* =========================================================
         CHANNEL BUFFS (self-cast)
         ✅ Always hit ENEMY (not self)
      ========================================================= */
      case "FENGLAI_CHANNEL": {
        addStatus({
          state,
          sourceUserId: source.userId,
          targetUserId: source.userId,
          card,
          statusTarget: source,
          type: "FENGLAI_CHANNEL",
          durationTurns: effect.durationTurns ?? 1,
          breakOnPlay: effect.breakOnPlay,
        });

        // immediate: deal 10 to enemy
        enemy.hp = Math.max(0, enemy.hp - 10);

        pushEvent(state, {
          turn: state.turn,
          type: "DAMAGE",
          actorUserId: source.userId,
          targetUserId: enemy.userId,
          cardId: card.id,
          cardName: card.name,
          effectType: "DAMAGE",
          value: 10,
        });
        break;
      }

      case "WUJIAN_CHANNEL": {
        addStatus({
          state,
          sourceUserId: source.userId,
          targetUserId: source.userId,
          card,
          statusTarget: source,
          type: "WUJIAN_CHANNEL",
          durationTurns: effect.durationTurns ?? 1,
          breakOnPlay: effect.breakOnPlay,
        });

        // immediate: deal 10 to enemy, heal 3 to self
        enemy.hp = Math.max(0, enemy.hp - 10);

        const before = source.hp;
        source.hp = Math.min(100, source.hp + 3);
        const appliedHeal = Math.max(0, source.hp - before);

        pushEvent(state, {
          turn: state.turn,
          type: "DAMAGE",
          actorUserId: source.userId,
          targetUserId: enemy.userId,
          cardId: card.id,
          cardName: card.name,
          effectType: "DAMAGE",
          value: 10,
        });

        if (appliedHeal > 0) {
          pushEvent(state, {
            turn: state.turn,
            type: "HEAL",
            actorUserId: source.userId,
            targetUserId: source.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "HEAL",
            value: appliedHeal,
          });
        }
        break;
      }

      /* ================= PATCH 0.3 ================= */
      case "XINZHENG_CHANNEL": {
        addStatus({
          state,
          sourceUserId: source.userId,
          targetUserId: source.userId,
          card,
          statusTarget: source,
          type: "XINZHENG_CHANNEL",
          durationTurns: effect.durationTurns ?? 2,
          breakOnPlay: effect.breakOnPlay,
        });
        break;
      }

      default: {
        // statuses / timed effects
        if (!effect.durationTurns) break;

        const statusTarget = effTarget;

        // CONTROL immunity check (kept)
        if (
          effect.type === "CONTROL" &&
          statusTarget.statuses.some((s) => s.type === "CONTROL_IMMUNE")
        ) {
          break;
        }

        addStatus({
          state,
          sourceUserId: source.userId,
          targetUserId: statusTarget.userId,
          card,
          statusTarget,
          type: effect.type,
          value: effect.value,
          durationTurns: effect.durationTurns,
          repeatTurns: effect.repeatTurns,
          chance: effect.chance,
          breakOnPlay: effect.breakOnPlay,
        });
      }
    }
  }

  // end game check
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)?.userId;
    }
  }
}
