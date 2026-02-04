/**
 * backend/game/engine/flow/turnResolver.ts
 *
 * Turn timeline resolver.
 * - End-of-turn triggers
 * - Channel effects
 * - Status expiration
 * - Turn advancement
 */

import { GameState } from "../state/types";
import { randomUUID } from "crypto";
import { shouldDodge, hasUntargetable } from "../rules/guards";

import { resolveScheduledDamage } from "../utils/combatMath";

function pushDamageEvent(
  state: GameState,
  actorUserId: string,
  targetUserId: string,
  cardId: string | undefined,
  cardName: string | undefined,
  value: number
) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    turn: state.turn,
    type: "DAMAGE",
    actorUserId,
    targetUserId,
    cardId,
    cardName,
    effectType: "DAMAGE",
    value,
  });
}

function pushHealEvent(
  state: GameState,
  actorUserId: string,
  targetUserId: string,
  cardId: string | undefined,
  cardName: string | undefined,
  value: number
) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    turn: state.turn,
    type: "HEAL",
    actorUserId,
    targetUserId,
    cardId,
    cardName,
    effectType: "HEAL",
    value,
  });
}

export function resolveTurnEnd(state: GameState) {
  if (state.gameOver) return;

  const currentIndex = state.activePlayerIndex;
  const otherIndex = currentIndex === 0 ? 1 : 0;

  const current = state.players[currentIndex];
  const other = state.players[otherIndex];

  /* ================= END OF TURN (OWNER) ================= */

  for (const s of current.statuses) {
    if (s.type === "DELAYED_DAMAGE" && (s.repeatTurns ?? 0) > 0) {
      current.hp = Math.max(0, current.hp - (s.value ?? 0));
      s.repeatTurns!--;
    }

    if (s.type === "FENGLAI_CHANNEL") {
      if (hasUntargetable(other)) {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
        continue;
      }

      if (!shouldDodge(other)) {
        const dmg = resolveScheduledDamage({ source: current, target: other, base: 10 });
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }

    if (s.type === "WUJIAN_CHANNEL") {
      if (!shouldDodge(other)) {
        const dmg = resolveScheduledDamage({ source: current, target: other, base: 10 });
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      }

      const before = current.hp;
      current.hp = Math.min(100, current.hp + 3);
      const applied = Math.max(0, current.hp - before);
      if (applied > 0) {
        pushHealEvent(state, current.userId, current.userId, s.sourceCardId, s.sourceCardName, applied);
      }
    }

    if (s.type === "XINZHENG_CHANNEL") {
      if (!shouldDodge(other)) {
        const dmg = resolveScheduledDamage({ source: current, target: other, base: 5 });
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      }
    }
  }

  /* ================= STATUS EXPIRY ================= */

  for (const p of state.players) {
    p.statuses = p.statuses.filter((status) => state.turn < status.expiresAtTurn);
  }

  /* ================= ADVANCE TURN ================= */

  state.turn += 1;
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;

  const me = state.players[state.activePlayerIndex];
  const enemy = state.players[state.activePlayerIndex === 0 ? 1 : 0];

  /* ================= START OF TURN ================= */

  for (const s of me.statuses) {
    if (s.type === "START_TURN_DAMAGE") {
      me.hp = Math.max(0, me.hp - (s.value ?? 0));
    }
    if (s.type === "START_TURN_HEAL") {
      me.hp = Math.min(100, me.hp + (s.value ?? 0));
    }
  }

  /* ================= FINAL GAME OVER ================= */

  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId =
        state.players.find((x) => x.userId !== p.userId)?.userId;
      return;
    }
  }
}
