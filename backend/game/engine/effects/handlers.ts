// backend/game/engine/effects/handlers.ts

import { randomUUID } from "crypto";
import {
  GameState,
  Card,
  GameEvent,
  ActiveBuff,
  CardEffect,
} from "../state/types";
import { blocksEnemyTargeting } from "../rules/guards";
import { addBuff } from "./system";
import {
  resolveScheduledDamage,
  resolveHealAmount,
} from "../utils/combatMath";

/* =========================================================
   EVENT HELPER
========================================================= */
function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
}

/* =========================================================
   DAMAGE
========================================================= */
export function handleDamage(
  state: GameState,
  source: any,
  target: any,
  isEnemyEffect: boolean,
  card: Card,
  effect: CardEffect
) {
  if (isEnemyEffect && blocksEnemyTargeting(target)) {
    pushEvent(state, {
      turn: state.turn,
      type: "DAMAGE",
      actorUserId: source.userId,
      targetUserId: target.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "DAMAGE",
      value: 0,
    });
    return;
  }

  const base = effect.value ?? 0;
  const final = resolveScheduledDamage({ source, target, base });

  if (final > 0) {
    target.hp = Math.max(0, target.hp - final);
  }

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

/* =========================================================
   BONUS DAMAGE (HP THRESHOLD)
========================================================= */
export function handleBonusDamageIfHpGt(
  state: GameState,
  source: any,
  target: any,
  opponentHpAtCardStart: number,
  card: Card,
  effect: CardEffect
) {
  const threshold = effect.threshold ?? 0;
  const bonus = effect.value ?? 0;

  if (opponentHpAtCardStart <= threshold || bonus <= 0) return;

  if (blocksEnemyTargeting(target)) {
    pushEvent(state, {
      turn: state.turn,
      type: "DAMAGE",
      actorUserId: source.userId,
      targetUserId: target.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "DAMAGE",
      value: 0,
    });
    return;
  }

  const final = resolveScheduledDamage({ source, target, base: bonus });

  if (final > 0) {
    target.hp = Math.max(0, target.hp - final);
  }

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

/* =========================================================
   HEAL
========================================================= */
export function handleHeal(
  state: GameState,
  source: any,
  target: any,
  card: Card,
  effect: CardEffect
) {
  const base = effect.value ?? 0;
  const final = resolveHealAmount({ target, base });

  const before = target.hp;
  target.hp = Math.min(100, target.hp + final);
  const applied = Math.max(0, target.hp - before);

  if (applied > 0) {
    pushEvent(state, {
      turn: state.turn,
      type: "HEAL",
      actorUserId: source.userId,
      targetUserId: target.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "HEAL",
      value: applied,
    });
  }
}

/* =========================================================
   DRAW
========================================================= */
export function handleDraw(state: GameState, source: any, effect: CardEffect) {
  for (let i = 0; i < (effect.value ?? 0); i++) {
    const c = state.deck.shift();
    if (c) source.hand.push(c);
  }
}

/* =========================================================
   CLEANSE
========================================================= */
export function handleCleanse(source: any) {
  // Remove CONTROL + ATTACK_LOCK only (legacy behavior preserved)
  source.buffs = source.buffs.filter(
    (b: ActiveBuff) =>
      !b.effects.some(
        (e) => e.type === "CONTROL" || e.type === "ATTACK_LOCK"
      )
  );
}

/* =========================================================
   CHANNEL IMMEDIATE TICKS ONLY
   (Buff lifecycle handled by card.buffs)
========================================================= */
export function handleChannelEffect(
  state: GameState,
  source: any,
  enemy: any,
  card: Card,
  effect: CardEffect
) {
  // XINZHENG has no immediate tick
  if (effect.type === "XINZHENG_CHANNEL") return;

  // Immediate damage tick
  if (blocksEnemyTargeting(enemy)) {
    pushEvent(state, {
      turn: state.turn,
      type: "DAMAGE",
      actorUserId: source.userId,
      targetUserId: enemy.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "DAMAGE",
      value: 0,
    });
  } else {
    const dmg = resolveScheduledDamage({
      source,
      target: enemy,
      base: 10,
    });

    enemy.hp = Math.max(0, enemy.hp - dmg);

    pushEvent(state, {
      turn: state.turn,
      type: "DAMAGE",
      actorUserId: source.userId,
      targetUserId: enemy.userId,
      cardId: card.id,
      cardName: card.name,
      effectType: "DAMAGE",
      value: dmg,
    });
  }

  // WUJIAN immediate self-heal
  if (effect.type === "WUJIAN_CHANNEL") {
    const before = source.hp;
    source.hp = Math.min(100, source.hp + 3);
    const applied = Math.max(0, source.hp - before);

    if (applied > 0) {
      pushEvent(state, {
        turn: state.turn,
        type: "HEAL",
        actorUserId: source.userId,
        targetUserId: source.userId,
        cardId: card.id,
        cardName: card.name,
        effectType: "HEAL",
        value: applied,
      });
    }
  }
}

/* =========================================================
   APPLY CARD-DEFINED BUFFS (ONLY SOURCE OF BUFFS)
========================================================= */
export function handleApplyBuffs(params: {
  state: GameState;
  card: Card;
  source: any;
  target: any;
  isEnemyEffect: boolean;
}) {
  const { state, card, source, target, isEnemyEffect } = params;

  if (!Array.isArray(card.buffs) || card.buffs.length === 0) return;

  for (const buff of card.buffs) {
    // Enemy buffs blocked by target avoidance
    if (isEnemyEffect && blocksEnemyTargeting(target)) continue;

    addBuff({
      state,
      sourceUserId: source.userId,
      targetUserId: target.userId,
      card,
      buffTarget: target,
      buff,
    });
  }
}
