// backend/game/engine/flow/turnResolver.ts

import { GameState, ActiveBuff, BuffEffect } from "../state/types";
import { randomUUID } from "crypto";
import { shouldDodge, hasUntargetable, blocksEnemyTargeting } from "../rules/guards";
import { resolveScheduledDamage, resolveHealAmount } from "../utils/combatMath";
import { pushBuffExpired } from "../effects/system";

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

function allEffectsFromBuff(buff: ActiveBuff) {
  return buff.effects;
}

export function resolveTurnEnd(state: GameState) {
  if (state.gameOver) return;

  const currentIndex = state.activePlayerIndex;
  const otherIndex = currentIndex === 0 ? 1 : 0;

  const current = state.players[currentIndex];
  const other = state.players[otherIndex];

  /* ================= END OF TURN (OWNER) ================= */

  for (const buff of current.buffs) {
    for (const e of allEffectsFromBuff(buff)) {
      // DELAYED_DAMAGE on owner end turn
      if (e.type === "DELAYED_DAMAGE" && (e.repeatTurns ?? 0) > 0) {
        const dmg = Math.max(0, e.value ?? 0);
        current.hp = Math.max(0, current.hp - dmg);
        e.repeatTurns!--;
        pushDamageEvent(state, current.userId, current.userId, buff.sourceCardId, buff.sourceCardName, dmg);
      }

      // FENGLAI tick on owner end turn
      if (e.type === "FENGLAI_CHANNEL") {
        if (hasUntargetable(other)) {
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, 0);
          continue;
        }

        // keep old behavior: dodge applies
        if (!shouldDodge(other)) {
          const dmg = resolveScheduledDamage({ source: current, target: other, base: 10 });
          other.hp = Math.max(0, other.hp - dmg);
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, dmg);
        } else {
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, 0);
        }
      }

      // WUJIAN tick on owner end turn (10 dmg to other + heal 3)
      if (e.type === "WUJIAN_CHANNEL") {
        if (!shouldDodge(other)) {
          const dmg = resolveScheduledDamage({ source: current, target: other, base: 10 });
          other.hp = Math.max(0, other.hp - dmg);
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, dmg);
        } else {
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, 0);
        }

        const heal = resolveHealAmount({ target: current, base: 3 });
        const before = current.hp;
        current.hp = Math.min(100, current.hp + heal);
        const applied = Math.max(0, current.hp - before);
        if (applied > 0) {
          pushHealEvent(state, current.userId, current.userId, buff.sourceCardId, buff.sourceCardName, applied);
        }
      }

      // XINZHENG tick on owner end turn (5 dmg)
      if (e.type === "XINZHENG_CHANNEL") {
        if (!shouldDodge(other)) {
          const dmg = resolveScheduledDamage({ source: current, target: other, base: 5 });
          other.hp = Math.max(0, other.hp - dmg);
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, dmg);
        } else {
          pushDamageEvent(state, current.userId, other.userId, buff.sourceCardId, buff.sourceCardName, 0);
        }
      }
    }
  }

  /* ================= BUFF EXPIRY ================= */

  for (const p of state.players) {
    const before = p.buffs.slice();
    p.buffs = p.buffs.filter((b) => state.turn < b.expiresAtTurn);

    // emit expired events
    for (const old of before) {
      const still = p.buffs.some((b) => b.buffId === old.buffId);
      if (!still) {
        pushBuffExpired(state, {
          targetUserId: p.userId,
          buffId: old.buffId,
          buffName: old.name,
          buffCategory: old.category,
          sourceCardId: old.sourceCardId,
          sourceCardName: old.sourceCardName,
        });
      }
    }
  }

  /* ================= ADVANCE TURN ================= */

  state.turn += 1;
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;

  const me = state.players[state.activePlayerIndex];
  const enemy = state.players[state.activePlayerIndex === 0 ? 1 : 0];

  /* ================= START OF TURN ================= */

  for (const buff of me.buffs) {
    for (const e of buff.effects) {
      if (e.type === "START_TURN_DAMAGE") {
        const dmg = Math.max(0, e.value ?? 0);
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(state, enemy.userId, me.userId, buff.sourceCardId, buff.sourceCardName, dmg);
      }

      if (e.type === "START_TURN_HEAL") {
        const heal = resolveHealAmount({ target: me, base: e.value ?? 0 });
        const before = me.hp;
        me.hp = Math.min(100, me.hp + heal);
        const applied = Math.max(0, me.hp - before);
        if (applied > 0) {
          pushHealEvent(state, me.userId, me.userId, buff.sourceCardId, buff.sourceCardName, applied);
        }
      }
    }
  }

  /* ================= FINAL GAME OVER ================= */

  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find((x) => x.userId !== p.userId)?.userId;
      return;
    }
  }
}
