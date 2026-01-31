import { randomUUID } from "crypto";
import {
  GameState,
  Card,
  Status,
  GameEvent,
  EffectType,
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
  // You want to keep your old expire rule:
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
  const target = state.players[targetIndex];
  const enemy = getEnemy(state, playerIndex);

  const statusTarget = card.target === "SELF" ? source : target;

  /* =========================================================
     ✅ FIX #1: breakOnPlay MUST only affect the player who PLAYED a card.
     - breakOnPlay is "your effect ends when YOU cast"
     - enemy casting should NOT break your statuses
  ========================================================= */
  source.statuses = source.statuses.filter((s) => !s.breakOnPlay);
  // ❌ DO NOT TOUCH target.statuses here

  for (const effect of card.effects) {
    switch (effect.type) {
      case "DAMAGE": {
        let damage = effect.value ?? 0;

        // damage multiplier on source
        const boost = source.statuses.find((s) => s.type === "DAMAGE_MULTIPLIER");
        if (boost) damage *= boost.value ?? 1;

        // damage reduction on target
        const dr = target.statuses.find((s) => s.type === "DAMAGE_REDUCTION");
        if (dr) damage *= 1 - (dr.value ?? 0);

        const final = Math.floor(damage);
        target.hp = Math.max(0, target.hp - final);

        if (final > 0) {
          pushEvent(state, {
            turn: state.turn,
            type: "DAMAGE",
            actorUserId: source.userId,
            targetUserId: target.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "DAMAGE",
            value: final,
          });
        }
        break;
      }

      case "HEAL": {
        let heal = effect.value ?? 0;

        // heal reduction on source (self)
        const hr = source.statuses.find((s) => s.type === "HEAL_REDUCTION");
        if (hr) heal *= 1 - (hr.value ?? 0);

        const final = Math.floor(heal);
        const before = source.hp;
        source.hp = Math.min(100, source.hp + final);

        if (source.hp > before) {
          pushEvent(state, {
            turn: state.turn,
            type: "HEAL",
            actorUserId: source.userId,
            targetUserId: source.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "HEAL",
            value: source.hp - before,
          });
        }
        break;
      }

      case "DRAW": {
        for (let i = 0; i < (effect.value ?? 0); i++) {
          const c = state.deck.shift();
          if (c) source.hand.push(c);
        }
        break;
      }

      case "CLEANSE": {
        source.statuses = source.statuses.filter((s) => s.type !== "CONTROL");
        break;
      }

      /* =========================================================
         CHANNEL BUFFS (self-cast)
         ✅ Always hit ENEMY (not self)
         ✅ Are BUFF category via effectCategories + addStatus()
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

      default: {
        if (!effect.durationTurns) break;

        // CONTROL immunity check
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
