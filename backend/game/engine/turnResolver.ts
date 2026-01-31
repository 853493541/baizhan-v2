// backend/game/engine/turnResolver.ts

import { GameState } from "./types";
import { randomUUID } from "crypto";

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
     1) END-OF-TURN TRIGGERS
     - These happen when the current player ends their turn.
  ========================================================= */

  // ✅ DELAYED_DAMAGE: ticks on the owner at end of their own turn
  // ✅ RepeatTurns decremented here
  for (const s of current.statuses) {
    if (s.type === "DELAYED_DAMAGE" && (s.repeatTurns ?? 0) > 0) {
      const dmg = s.value ?? 0;
      current.hp = Math.max(0, current.hp - dmg);
      s.repeatTurns = (s.repeatTurns ?? 0) - 1;
    }
  }

  // ✅ FENGLAI: end-of-your-turn deals 10 to enemy (active damage)
  for (const s of current.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      const dmg = 10;
      other.hp = Math.max(0, other.hp - dmg);

      pushDamageEvent(
        state,
        current.userId,
        other.userId,
        s.sourceCardId,
        s.sourceCardName,
        dmg
      );
    }

    // ✅ WUJIAN: end-of-your-turn deals 10 to enemy + heal 3
    if (s.type === "WUJIAN_CHANNEL") {
      const dmg = 10;
      const heal = 3;

      other.hp = Math.max(0, other.hp - dmg);
      pushDamageEvent(
        state,
        current.userId,
        other.userId,
        s.sourceCardId,
        s.sourceCardName,
        dmg
      );

      const before = current.hp;
      current.hp = Math.min(100, current.hp + heal);
      const applied = Math.max(0, current.hp - before);
      if (applied > 0) {
        pushHealEvent(
          state,
          current.userId,
          current.userId,
          s.sourceCardId,
          s.sourceCardName,
          applied
        );
      }
    }
  }

  /* =========================================================
     2) EXPIRE FILTER (keep your existing rule)
     - We DO NOT change: state.turn < expiresAtTurn
  ========================================================= */
  for (const p of state.players) {
    p.statuses = p.statuses.filter((status) => state.turn < status.expiresAtTurn);
  }

  /* =========================================================
     3) CHECK END GAME AFTER END-OF-TURN DAMAGE
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find((x) => x.userId !== p.userId);
      state.winnerUserId = winner?.userId;
      return;
    }
  }

  /* =========================================================
     4) ADVANCE TURN
  ========================================================= */
  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;

  const newIndex = state.activePlayerIndex;
  const enemyIndex = newIndex === 0 ? 1 : 0;

  const me = state.players[newIndex];        // player whose turn STARTS now
  const enemy = state.players[enemyIndex];   // the other player

  /* =========================================================
     5) START-OF-TURN TRIGGERS (for player whose turn starts)
     - START_TURN_DAMAGE / START_TURN_HEAL happen on the owner
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
     6) ENEMY-TURN-START TRIGGERS FOR CHANNEL BUFFS
     - These are self-buffs on the caster that damage the enemy.
     - When enemy turn starts, the caster is `enemy`, and the enemy is `me`.
  ========================================================= */

  // At the start of "me" turn:
  // - check if enemy has channel buff that triggers on enemy turn start

  // ✅ FENGLAI: enemy turn start deals 10 to current player (me)
  // The caster is enemy; the target is me.
  for (const s of enemy.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      const dmg = 10;
      me.hp = Math.max(0, me.hp - dmg);

      pushDamageEvent(
        state,
        enemy.userId,
        me.userId,
        s.sourceCardId,
        s.sourceCardName,
        dmg
      );
    }

    // ✅ WUJIAN: enemy turn start deals 20 to current player + heal 6
    if (s.type === "WUJIAN_CHANNEL") {
      const dmg = 20;
      const heal = 6;

      me.hp = Math.max(0, me.hp - dmg);
      pushDamageEvent(
        state,
        enemy.userId,
        me.userId,
        s.sourceCardId,
        s.sourceCardName,
        dmg
      );

      const before = enemy.hp;
      enemy.hp = Math.min(100, enemy.hp + heal);
      const applied = Math.max(0, enemy.hp - before);
      if (applied > 0) {
        pushHealEvent(
          state,
          enemy.userId,
          enemy.userId,
          s.sourceCardId,
          s.sourceCardName,
          applied
        );
      }

      // ✅ WUJIAN ends after enemy-turn-start stage
      enemy.statuses = enemy.statuses.filter((x) => x !== s);
    }
  }

  /* =========================================================
     7) CHECK END GAME AFTER START-OF-TURN TRIGGERS
  ========================================================= */
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find((x) => x.userId !== p.userId);
      state.winnerUserId = winner?.userId;
      return;
    }
  }
}
