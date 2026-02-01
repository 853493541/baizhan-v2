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
     - happen when current player ends their turn
  ========================================================= */

  // ✅ DELAYED_DAMAGE: ticks on the owner at end of their own turn
  for (const s of current.statuses) {
    if (s.type === "DELAYED_DAMAGE" && (s.repeatTurns ?? 0) > 0) {
      const dmg = s.value ?? 0;
      current.hp = Math.max(0, current.hp - dmg);
      s.repeatTurns = (s.repeatTurns ?? 0) - 1;
    }
  }

  // ✅ FENGLAI: end-of-your-turn deals 10 to enemy
  for (const s of current.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      const dmg = 10;
      other.hp = Math.max(0, other.hp - dmg);
      pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
    }

    // ✅ WUJIAN: end-of-your-turn deals 10 to enemy + heal 3
    if (s.type === "WUJIAN_CHANNEL") {
      const dmg = 10;
      const heal = 3;

      other.hp = Math.max(0, other.hp - dmg);
      pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);

      const before = current.hp;
      current.hp = Math.min(100, current.hp + heal);
      const applied = Math.max(0, current.hp - before);
      if (applied > 0) {
        pushHealEvent(state, current.userId, current.userId, s.sourceCardId, s.sourceCardName, applied);
      }
    }

    /* ================= PATCH 0.3 =================
       ✅ 心诤：自己回合结束 → 对目标造成 5
    ================================================= */
    if (s.type === "XINZHENG_CHANNEL") {
      const dmg = 5;
      other.hp = Math.max(0, other.hp - dmg);
      pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
    }
  }

  /* ================= PATCH 0.3 =================
     ✅ 心诤：目标回合结束 → 运功结束，对目标造成 15
     - i.e. when CURRENT ends turn, if OTHER (the opponent) has XINZHENG_CHANNEL,
       then CURRENT is the "target" ending their turn → take 15 and channel ends.
  ================================================= */
  for (const s of other.statuses) {
    if (s.type === "XINZHENG_CHANNEL") {
      const dmg = 15;
      current.hp = Math.max(0, current.hp - dmg);
      pushDamageEvent(state, other.userId, current.userId, s.sourceCardId, s.sourceCardName, dmg);

      // end channel immediately after the target ends their turn
      other.statuses = other.statuses.filter((x) => x !== s);
      break;
    }
  }

  /* =========================================================
     2) EXPIRE FILTER (keep your existing rule)
     - DO NOT change: state.turn < expiresAtTurn
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
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;

  const newIndex = state.activePlayerIndex;
  const enemyIndex = newIndex === 0 ? 1 : 0;

  const me = state.players[newIndex];        // player whose turn STARTS now
  const enemy = state.players[enemyIndex];   // the other player

  /* =========================================================
     5) START-OF-TURN TRIGGERS (owner)
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
     - At the start of "me" turn:
       - check enemy channel buffs that trigger on enemy-turn-start
  ========================================================= */
  for (const s of enemy.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      const dmg = 10;
      me.hp = Math.max(0, me.hp - dmg);
      pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
    }

    if (s.type === "WUJIAN_CHANNEL") {
      const dmg = 20;
      const heal = 6;

      me.hp = Math.max(0, me.hp - dmg);
      pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);

      const before = enemy.hp;
      enemy.hp = Math.min(100, enemy.hp + heal);
      const applied = Math.max(0, enemy.hp - before);
      if (applied > 0) {
        pushHealEvent(state, enemy.userId, enemy.userId, s.sourceCardId, s.sourceCardName, applied);
      }

      // ✅ WUJIAN ends after enemy-turn-start stage
      enemy.statuses = enemy.statuses.filter((x) => x !== s);
      break;
    }

    /* ================= PATCH 0.3 =================
       ✅ 心诤：目标回合开始 → 对目标造成 5
       - enemy has the channel (caster)
       - me is the target whose turn just started
    ================================================= */
    if (s.type === "XINZHENG_CHANNEL") {
      const dmg = 5;
      me.hp = Math.max(0, me.hp - dmg);
      pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
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
