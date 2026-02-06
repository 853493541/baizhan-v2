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
   BUFF SOURCE HELPERS (🔥 NEW, NON-BREAKING)
========================================================= */

function getBuffSourceCardId(buff: ActiveBuff) {
  return buff.sourceCardId;
}

function getBuffSourceCardName(buff: ActiveBuff) {
  // 🔑 fallback guarantees frontend can always render text
  return buff.sourceCardName ?? buff.name;
}

function getBuffSourceCardNameWithDebug(
  buff: ActiveBuff,
  debug?: string
) {
  const base = getBuffSourceCardName(buff);
  return debug ? `${base} · ${debug}` : base;
}

/* =========================================================
   BUFF TICK HELPERS
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
   SCHEDULED DAMAGE (STAGED, NON-BREAKING)
========================================================= */

function applyScheduledDamage(
  state: GameState,
  phase: "TURN_START" | "TURN_END",
  ownerIndex: number
) {
  const owner = state.players[ownerIndex];
  const enemy = state.players[ownerIndex === 0 ? 1 : 0];

  for (const buff of owner.buffs) {
    if (buff.stageIndex == null) buff.stageIndex = 0;

    const scheduled = buff.effects.filter(
      (e) => e.type === "SCHEDULED_DAMAGE"
    );

    const stage = scheduled[buff.stageIndex];
    if (!stage) continue;

    const isOwnersTurn = ownerIndex === state.activePlayerIndex;

    if (stage.when !== phase) continue;
    if (stage.turnOf === "OWNER" && !isOwnersTurn) continue;
    if (stage.turnOf === "ENEMY" && isOwnersTurn) continue;

    const target = stage.target === "SELF" ? owner : enemy;

    if (target.userId !== owner.userId) {
      if (hasUntargetable(target) || shouldDodge(target)) {
        pushDamageEvent(
          state,
          owner.userId,
          target.userId,
          getBuffSourceCardId(buff),
          getBuffSourceCardNameWithDebug(buff, stage.debug),
          0,
          "SCHEDULED_DAMAGE"
        );
        buff.stageIndex += 1;
        continue;
      }
    }

    const dmg = resolveScheduledDamage({
      source: owner,
      target,
      base: stage.value ?? 0,
    });

    target.hp = Math.max(0, target.hp - dmg);

    pushDamageEvent(
      state,
      owner.userId,
      target.userId,
      getBuffSourceCardId(buff),
      getBuffSourceCardNameWithDebug(buff, stage.debug),
      dmg,
      "SCHEDULED_DAMAGE"
    );

    // OPTIONAL LIFESTEAL
    if (stage.lifestealPct && dmg > 0) {
      const heal = Math.floor(dmg * stage.lifestealPct);
      const before = owner.hp;

      owner.hp = Math.min(100, owner.hp + heal);
      const applied = owner.hp - before;

      if (applied > 0) {
        pushHealEvent(
          state,
          owner.userId,
          owner.userId,
          getBuffSourceCardId(buff),
          getBuffSourceCardNameWithDebug(buff, "吸血"),
          applied
        );
      }
    }

    buff.stageIndex += 1;
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

  /* ================= END OF TURN ================= */

  applyScheduledDamage(state, "TURN_END", 0);
  applyScheduledDamage(state, "TURN_END", 1);

  for (const buff of current.buffs) {
    for (const e of buff.effects) {
      if (e.type === "FENGLAI_CHANNEL") {
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
            getBuffSourceCardId(buff),
            getBuffSourceCardName(buff),
            dmg
          );
        }
      }

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
            getBuffSourceCardId(buff),
            getBuffSourceCardName(buff),
            dmg
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
            getBuffSourceCardId(buff),
            getBuffSourceCardName(buff),
            applied
          );
        }
      }

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
            getBuffSourceCardId(buff),
            getBuffSourceCardName(buff),
            dmg
          );
        }
      }
    }
  }

  tickBuffs(current, "TURN_END");
  cleanupExpiredBuffs(state, current);

  /* ================= ADVANCE TURN ================= */

  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;

  const me = state.players[state.activePlayerIndex];
  const enemy = state.players[state.activePlayerIndex === 0 ? 1 : 0];

  /* ================= START OF TURN ================= */

  applyScheduledDamage(state, "TURN_START", 0);
  applyScheduledDamage(state, "TURN_START", 1);

  tickBuffs(me, "TURN_START");
  cleanupExpiredBuffs(state, me);

  for (const buff of me.buffs) {
    for (const e of buff.effects) {
      if (e.type === "START_TURN_DAMAGE") {
        const dmg = resolveScheduledDamage({
          source: enemy,
          target: me,
          base: e.value ?? 0,
        });

        me.hp = Math.max(0, me.hp - dmg);

        pushDamageEvent(
          state,
          enemy.userId,
          me.userId,
          getBuffSourceCardId(buff),
          getBuffSourceCardName(buff),
          dmg,
          "SCHEDULED_DAMAGE"
        );
      }

      if (e.type === "START_TURN_HEAL") {
        const heal = resolveHealAmount({
          target: me,
          base: e.value ?? 0,
        });
        const before = me.hp;
        me.hp = Math.min(100, me.hp + heal);
        const applied = Math.max(0, me.hp - before);

        if (applied > 0) {
          pushHealEvent(
            state,
            me.userId,
            me.userId,
            getBuffSourceCardId(buff),
            getBuffSourceCardName(buff),
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
