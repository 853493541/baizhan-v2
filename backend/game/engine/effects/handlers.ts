// backend/game/engine/effects/handlers.ts

import { randomUUID } from "crypto";
import { GameState, Card, GameEvent, ActiveBuff, BuffDefinition, CardEffect } from "../state/types";
import { blocksEnemyTargeting } from "../rules/guards";
import { addBuff } from "./system";
import { resolveScheduledDamage, resolveHealAmount } from "../utils/combatMath";

function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
}

function hasDamageMultiplier(source: { buffs: ActiveBuff[] }) {
  return source.buffs.some((b) => b.effects.some((e) => e.type === "DAMAGE_MULTIPLIER"));
}

/** Damage uses scheduled math (multiplier + reduction) for consistency */
export function handleDamage(
  state: GameState,
  source: any,
  target: any,
  isEnemyEffect: boolean,
  card: Card,
  effect: any
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

export function handleBonusDamageIfHpGt(
  state: GameState,
  source: any,
  target: any,
  opponentHpAtCardStart: number,
  card: Card,
  effect: any
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

export function handleHeal(
  state: GameState,
  source: any,
  target: any,
  card: Card,
  effect: any
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

export function handleDraw(state: GameState, source: any, effect: any) {
  for (let i = 0; i < (effect.value ?? 0); i++) {
    const c = state.deck.shift();
    if (c) source.hand.push(c);
  }
}

export function handleCleanse(source: any) {
  // remove CONTROL + ATTACK_LOCK only (matches your old behavior)
  source.buffs = source.buffs.filter((b: ActiveBuff) =>
    !b.effects.some((e) => e.type === "CONTROL" || e.type === "ATTACK_LOCK")
  );
}

/**
 * CHANNEL BUFFS (self-cast)
 * - preserve original behavior
 */
export function handleChannelEffect(
  state: GameState,
  source: any,
  enemy: any,
  card: Card,
  effect: any
) {
  // Channel buff should already be provided as a buff definition in card.buffs,
  // but for safety we support legacy: if a cardEffect.type is *_CHANNEL we create a minimal buff.
  const durationTurns = effect.durationTurns ?? 1;

  const buff: BuffDefinition = {
    buffId: effect.__buffId ?? 9000, // fallback if you forgot to supply buff in card.buffs
    name: effect.__buffName ?? card.name,
    category: "BUFF",
    durationTurns,
    breakOnPlay: effect.breakOnPlay,
    effects: [{ type: effect.type, durationTurns, breakOnPlay: effect.breakOnPlay }],
  };

  addBuff({
    state,
    sourceUserId: source.userId,
    targetUserId: source.userId,
    card,
    buffTarget: source,
    buff,
  });

  if (effect.type === "XINZHENG_CHANNEL") return;

  // Immediate tick: 10 dmg to enemy (blocked by target-avoid)
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
    const dmg = resolveScheduledDamage({ source, target: enemy, base: 10 });
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

  // WUJIAN immediate self heal 3
  if (effect.type === "WUJIAN_CHANNEL") {
    const before = source.hp;
    source.hp = Math.min(100, source.hp + 3);
    const appliedHeal = Math.max(0, source.hp - before);

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
  }
}

/**
 * Apply card-defined buffs (modern path)
 */
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
    // If buff is applied to enemy and enemy is target-avoid, block it
    if (isEnemyEffect && blocksEnemyTargeting(target)) {
      // do nothing (blocked)
      continue;
    }

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
