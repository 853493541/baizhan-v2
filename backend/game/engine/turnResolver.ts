// backend/game/engine/turnResolver.ts

import { GameState } from "./types";
import { randomUUID } from "crypto";

/* =========================================================
   DODGE HELPER
   - stacks chance
   - persistent
   - caller must ensure "enemy-sourced" context
========================================================= */
function shouldDodge(target: { statuses: any[] }) {
  const chance = target.statuses
    .filter((s) => s.type === "DODGE_NEXT")
    .reduce((sum, s) => sum + (s.chance ?? 0), 0);

  if (chance <= 0) return false;
  return Math.random() < chance;
}

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

  /* =========================================================
     1) END-OF-TURN TRIGGERS (OWNER)
  ========================================================= */

  // ❌ DOT — NOT DODGEABLE
  for (const s of current.statuses) {
    if (s.type === "DELAYED_DAMAGE" && (s.repeatTurns ?? 0) > 0) {
      const dmg = s.value ?? 0;
      current.hp = Math.max(0, current.hp - dmg);
      s.repeatTurns = (s.repeatTurns ?? 0) - 1;
    }
  }

  // ✅ FENGLAI: end-of-your-turn → hit enemy
  for (const s of current.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      const dmg = 10;

      if (!shouldDodge(other)) {
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }

    // ✅ WUJIAN: end-of-your-turn → hit enemy + heal self
    if (s.type === "WUJIAN_CHANNEL") {
      const dmg = 10;
      const heal = 3;

      if (!shouldDodge(other)) {
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
      }

      const before = current.hp;
      current.hp = Math.min(100, current.hp + heal);
      const applied = Math.max(0, current.hp - before);
      if (applied > 0) {
        pushHealEvent(state, current.userId, current.userId, s.sourceCardId, s.sourceCardName, applied);
      }
    }

    // ✅ 心诤：自己回合结束 → 对目标造成 5
    if (s.type === "XINZHENG_CHANNEL") {
      const dmg = 5;

      if (!shouldDodge(other)) {
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }
  }

  /* =========================================================
     2) OPPONENT CHANNEL — TARGET END TURN
  ========================================================= */

  for (const s of other.statuses) {
    if (s.type === "XINZHENG_CHANNEL") {
      const dmg = 15;

      if (!shouldDodge(current)) {
        current.hp = Math.max(0, current.hp - dmg);
        pushDamageEvent(state, other.userId, current.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, other.userId, current.userId, s.sourceCardId, s.sourceCardName, 0);
      }

      // channel ends immediately
      other.statuses = other.statuses.filter((x) => x !== s);
      break;
    }
  }

  /* =========================================================
     3) EXPIRE FILTER (UNCHANGED)
  ========================================================= */
  for (const p of state.players) {
    p.statuses = p.statuses.filter((status) => state.turn < status.expiresAtTurn);
  }

  /* =========================================================
     4) CHECK END GAME
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)?.userId;
      return;
    }
  }

  /* =========================================================
     5) ADVANCE TURN
  ========================================================= */
  state.turn += 1;
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;

  const me = state.players[state.activePlayerIndex];
  const enemy = state.players[state.activePlayerIndex === 0 ? 1 : 0];

  /* =========================================================
     6) START-OF-TURN TRIGGERS (OWNER)
     ❌ DOT — NOT DODGEABLE
  ========================================================= */
  for (const s of me.statuses) {
    if (s.type === "START_TURN_DAMAGE") {
      const dmg = s.value ?? 0;
      me.hp = Math.max(0, me.hp - dmg);
    }
    if (s.type === "START_TURN_HEAL") {
      const heal = s.value ?? 0;
      me.hp = Math.min(100, me.hp + heal);
    }
  }

  /* =========================================================
     7) ENEMY-TURN-START CHANNEL DAMAGE
  ========================================================= */
  for (const s of enemy.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      const dmg = 10;

      if (!shouldDodge(me)) {
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }

    if (s.type === "WUJIAN_CHANNEL") {
      const dmg = 20;
      const heal = 6;

      if (!shouldDodge(me)) {
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
      }

      const before = enemy.hp;
      enemy.hp = Math.min(100, enemy.hp + heal);
      const applied = Math.max(0, enemy.hp - before);
      if (applied > 0) {
        pushHealEvent(state, enemy.userId, enemy.userId, s.sourceCardId, s.sourceCardName, applied);
      }

      // WUJIAN ends after this trigger
      enemy.statuses = enemy.statuses.filter((x) => x !== s);
      break;
    }

    // 心诤：目标回合开始 → 对目标造成 5
    if (s.type === "XINZHENG_CHANNEL") {
      const dmg = 5;

      if (!shouldDodge(me)) {
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }
  }

  /* =========================================================
     8) FINAL END GAME CHECK
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)?.userId;
      return;
    }
  }
}
