// backend/game/engine/flow/turnResolver.ts

import { GameState, ActiveBuff } from "../state/types";
import { randomUUID } from "crypto";
import { shouldDodge, hasUntargetable } from "../rules/guards";
import { resolveScheduledDamage, resolveHealAmount } from "../utils/combatMath";
import { pushBuffExpired } from "../effects/system";

/* =========================================================
   EVENT HELPERS
========================================================= */

function pushDamageEvent(
  state: GameState,
  actorUserId: string,
  targetUserId: string,
  cardId: string | undefined,
  cardName: string | undefined,
  value: number,
  effectType: "DAMAGE" | "SCHEDULED_DAMAGE" = "DAMAGE"
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
    effectType,
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

/* =========================================================
   BUFF TICK HELPERS (NEW)
========================================================= */

function tickBuffs(
  player: { userId: string; buffs: ActiveBuff[] },
  phase: "TURN_START" | "TURN_END"
) {
  for (const buff of player.buffs) {
    if (buff.tickOn === phase) {
      buff.remaining -= 1;
    }
  }
}

function cleanupExpiredBuffs(
  state: GameState,
  player: { userId: string; buffs: ActiveBuff[] }
) {
  const before = player.buffs.slice();

  player.buffs = player.buffs.filter((b) => b.remaining > 0);

  for (const old of before) {
    if (!player.buffs.some((b) => b.buffId === old.buffId)) {
      pushBuffExpired(state, {
        targetUserId: player.userId,
        buffId: old.buffId,
        buffName: old.name,
        buffCategory: old.category,
        sourceCardId: old.sourceCardId,
        sourceCardName: old.sourceCardName,
      });
    }
  }
}

/* =========================================================
   SCHEDULED DAMAGE (PATCH 0.5)
   - Executes outside card play on TURN_START / TURN_END boundaries
   - Runs for BOTH players' buffs (anyone's buff can fire on any boundary)
========================================================= */

function applyScheduledDamage(state: GameState, phase: "TURN_START" | "TURN_END") {
  for (let ownerIndex = 0; ownerIndex < state.players.length; ownerIndex++) {
    const owner = state.players[ownerIndex];
    const enemy = state.players[ownerIndex === 0 ? 1 : 0];

    for (const buff of owner.buffs) {
      for (const e of buff.effects) {
        if (e.type !== "SCHEDULED_DAMAGE") continue;
        if (e.when !== phase) continue;

        const target = e.target === "SELF" ? owner : enemy;

        // Enemy-only guards (keep behavior consistent with legacy channel ticks)
        if (target.userId !== owner.userId) {
          // Untargetable blocks enemy-applied scheduled damage
          if (hasUntargetable(target)) {
            pushDamageEvent(
              state,
              owner.userId,
              target.userId,
              buff.sourceCardId,
              buff.sourceCardName,
              0,
              "SCHEDULED_DAMAGE"
            );
            continue;
          }

          // Dodge can cancel scheduled damage
          if (shouldDodge(target)) {
            pushDamageEvent(
              state,
              owner.userId,
              target.userId,
              buff.sourceCardId,
              buff.sourceCardName,
              0,
              "SCHEDULED_DAMAGE"
            );
            continue;
          }
        }

        const dmg = resolveScheduledDamage({
          source: owner,
          target,
          base: e.value ?? 0,
        });

        target.hp = Math.max(0, target.hp - dmg);

        pushDamageEvent(
          state,
          owner.userId,
          target.userId,
          buff.sourceCardId,
          buff.sourceCardName,
          dmg,
          "SCHEDULED_DAMAGE"
        );
      }
    }
  }
}

/* =========================================================
   TURN RESOLVER
========================================================= */

export function resolveTurnEnd(state: GameState) {
  if (state.gameOver) return;

  const currentIndex = state.activePlayerIndex;
  const otherIndex = currentIndex === 0 ? 1 : 0;

  const current = state.players[currentIndex];
  const other = state.players[otherIndex];

  /* ================= END OF TURN (CURRENT PLAYER) ================= */

  // ✅ PATCH 0.5: scheduled damage fires BEFORE duration ticks / expiry
  applyScheduledDamage(state, "TURN_END");

  // Apply end-of-turn buff effects (channels, DOTs that tick at end)
  for (const buff of current.buffs) {
    for (const e of buff.effects) {
      // FENGLAI tick
      if (e.type === "FENGLAI_CHANNEL") {
        if (hasUntargetable(other)) {
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            0
          );
          continue;
        }

        if (!shouldDodge(other)) {
          const dmg = resolveScheduledDamage({
            source: current,
            target: other,
            base: 10,
          });
          other.hp = Math.max(0, other.hp - dmg);
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            dmg
          );
        } else {
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            0
          );
        }
      }

      // WUJIAN tick
      if (e.type === "WUJIAN_CHANNEL") {
        if (!shouldDodge(other)) {
          const dmg = resolveScheduledDamage({
            source: current,
            target: other,
            base: 10,
          });
          other.hp = Math.max(0, other.hp - dmg);
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            dmg
          );
        } else {
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            0
          );
        }

        const heal = resolveHealAmount({ target: current, base: 3 });
        const before = current.hp;
        current.hp = Math.min(100, current.hp + heal);
        const applied = Math.max(0, current.hp - before);

        if (applied > 0) {
          pushHealEvent(
            state,
            current.userId,
            current.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            applied
          );
        }
      }

      // XINZHENG tick
      if (e.type === "XINZHENG_CHANNEL") {
        if (!shouldDodge(other)) {
          const dmg = resolveScheduledDamage({
            source: current,
            target: other,
            base: 5,
          });
          other.hp = Math.max(0, other.hp - dmg);
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            dmg
          );
        } else {
          pushDamageEvent(
            state,
            current.userId,
            other.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            0
          );
        }
      }
    }
  }

  // ⏱ Tick TURN_END buffs for current player
  tickBuffs(current, "TURN_END");
  cleanupExpiredBuffs(state, current);

  /* ================= ADVANCE TURN ================= */

  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;

  const me = state.players[state.activePlayerIndex];
  const enemy = state.players[state.activePlayerIndex === 0 ? 1 : 0];

  /* ================= START OF TURN (NEW PLAYER) ================= */

  // ✅ PATCH 0.5: scheduled damage fires BEFORE duration ticks / expiry
  applyScheduledDamage(state, "TURN_START");

  // ⏱ Tick TURN_START buffs for new active player
  tickBuffs(me, "TURN_START");
  cleanupExpiredBuffs(state, me);

  // Apply start-of-turn buff effects
  for (const buff of me.buffs) {
    for (const e of buff.effects) {
      if (e.type === "START_TURN_DAMAGE") {
        const dmg = Math.max(0, e.value ?? 0);
        me.hp = Math.max(0, me.hp - dmg);
        pushDamageEvent(
          state,
          enemy.userId,
          me.userId,
          buff.sourceCardId,
          buff.sourceCardName,
          dmg
        );
      }

      if (e.type === "START_TURN_HEAL") {
        const heal = resolveHealAmount({ target: me, base: e.value ?? 0 });
        const before = me.hp;
        me.hp = Math.min(100, me.hp + heal);
        const applied = Math.max(0, me.hp - before);

        if (applied > 0) {
          pushHealEvent(
            state,
            me.userId,
            me.userId,
            buff.sourceCardId,
            buff.sourceCardName,
            applied
          );
        }
      }
    }
  }

  /* ================= GAME OVER ================= */

  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId =
        state.players.find((x) => x.userId !== p.userId)?.userId;
      return;
    }
  }
}
