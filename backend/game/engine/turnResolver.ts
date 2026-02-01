// backend/game/engine/turnResolver.ts

import { GameState } from "./types";
import { randomUUID } from "crypto";

/* =========================================================
   DODGE HELPER
   - stacks chance
   - persistent
========================================================= */
function shouldDodge(target: { statuses: any[] }) {
  const chance = target.statuses
    .filter((s) => s.type === "DODGE_NEXT")
    .reduce((sum, s) => sum + (s.chance ?? 0), 0);

  if (chance <= 0) return false;
  return Math.random() < chance;
}

/* =========================================================
   SCHEDULED DAMAGE RESOLVER
   - applies 女娲 / 减伤
   - DOT intentionally excluded
========================================================= */
function resolveScheduledDamage(params: {
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

  // DOT — NOT DODGEABLE, NOT BLOCKED BY UNTARGETABLE
  for (const s of current.statuses) {
    if (s.type === "DELAYED_DAMAGE" && (s.repeatTurns ?? 0) > 0) {
      const dmg = s.value ?? 0;
      current.hp = Math.max(0, current.hp - dmg);
      s.repeatTurns = (s.repeatTurns ?? 0) - 1;
    }
  }

  // 风来吴山
  for (const s of current.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      if (other.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
        continue;
      }

      if (!shouldDodge(other)) {
        const dmg = resolveScheduledDamage({
          source: current,
          target: other,
          base: 10,
        });
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }

    // 无间狱（回合结束）
    if (s.type === "WUJIAN_CHANNEL") {
      if (other.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
        continue;
      }

      if (!shouldDodge(other)) {
        const dmg = resolveScheduledDamage({
          source: current,
          target: other,
          base: 10,
        });
        other.hp = Math.max(0, other.hp - dmg);
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
      }

      const before = current.hp;
      current.hp = Math.min(100, current.hp + 3);
      const applied = Math.max(0, current.hp - before);
      if (applied > 0) {
        pushHealEvent(state, current.userId, current.userId, s.sourceCardId, s.sourceCardName, applied);
      }
    }

    // 心诤（自己回合结束）
    if (s.type === "XINZHENG_CHANNEL") {
      if (other.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, current.userId, other.userId, s.sourceCardId, s.sourceCardName, 0);
        continue;
      }

      if (!shouldDodge(other)) {
        const dmg = resolveScheduledDamage({
          source: current,
          target: other,
          base: 5,
        });
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
      if (current.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, other.userId, current.userId, s.sourceCardId, s.sourceCardName, 0);
        other.statuses = other.statuses.filter((x) => x !== s);
        break;
      }

      if (!shouldDodge(current)) {
        const dmg = resolveScheduledDamage({
          source: other,
          target: current,
          base: 15,
        });
        current.hp = Math.max(0, current.hp - dmg);
        pushDamageEvent(state, other.userId, current.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, other.userId, current.userId, s.sourceCardId, s.sourceCardName, 0);
      }

      other.statuses = other.statuses.filter((x) => x !== s);
      break;
    }
  }

  /* =========================================================
     3) EXPIRE FILTER
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
     ❌ DOT still applies
  ========================================================= */
  for (const s of me.statuses) {
    if (s.type === "START_TURN_DAMAGE") {
      me.hp = Math.max(0, me.hp - (s.value ?? 0));
    }
    if (s.type === "START_TURN_HEAL") {
      me.hp = Math.min(100, me.hp + (s.value ?? 0));
    }
  }

  /* =========================================================
     7) ENEMY TURN START CHANNEL
  ========================================================= */
  for (const s of enemy.statuses) {
    if (s.type === "FENGLAI_CHANNEL") {
      if (me.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
        continue;
      }

      if (!shouldDodge(me)) {
        const dmg = resolveScheduledDamage({
          source: enemy,
          target: me,
          base: 10,
        });
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
      }
    }

    if (s.type === "WUJIAN_CHANNEL") {
      if (me.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
        enemy.statuses = enemy.statuses.filter((x) => x !== s);
        break;
      }

      if (!shouldDodge(me)) {
        const dmg = resolveScheduledDamage({
          source: enemy,
          target: me,
          base: 20,
        });
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, dmg);
      } else {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
      }

      const before = enemy.hp;
      enemy.hp = Math.min(100, enemy.hp + 6);
      const applied = Math.max(0, enemy.hp - before);
      if (applied > 0) {
        pushHealEvent(state, enemy.userId, enemy.userId, s.sourceCardId, s.sourceCardName, applied);
      }

      enemy.statuses = enemy.statuses.filter((x) => x !== s);
      break;
    }

    if (s.type === "XINZHENG_CHANNEL") {
      if (me.statuses.some((x) => x.type === "UNTARGETABLE")) {
        pushDamageEvent(state, enemy.userId, me.userId, s.sourceCardId, s.sourceCardName, 0);
        continue;
      }

      if (!shouldDodge(me)) {
        const dmg = resolveScheduledDamage({
          source: enemy,
          target: me,
          base: 5,
        });
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
