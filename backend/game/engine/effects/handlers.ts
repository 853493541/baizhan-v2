
import { randomUUID } from "crypto";
import { GameState, Card, GameEvent } from "../state/types";
import { hasUntargetable } from "./effectUtils";
import { addStatus } from "./system";

function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
}

export function handleDamage(
  state: GameState,
  source: any,
  target: any,
  isEnemyEffect: boolean,
  card: Card,
  effect: any
) {
  if (isEnemyEffect && hasUntargetable(target)) {
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

  let damage = effect.value ?? 0;

  const boost = source.statuses.find((s: any) => s.type === "DAMAGE_MULTIPLIER");
  if (boost) damage *= boost.value ?? 1;

  const dr = target.statuses.find((s: any) => s.type === "DAMAGE_REDUCTION");
  if (dr) damage *= 1 - (dr.value ?? 0);

  const final = Math.floor(damage);
  if (final > 0) {
    target.hp = Math.max(0, target.hp - final);
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

  if (hasUntargetable(target)) {
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

  let damage = bonus;

  const boost = source.statuses.find((s: any) => s.type === "DAMAGE_MULTIPLIER");
  if (boost) damage *= boost.value ?? 1;

  const dr = target.statuses.find((s: any) => s.type === "DAMAGE_REDUCTION");
  if (dr) damage *= 1 - (dr.value ?? 0);

  const final = Math.floor(damage);
  if (final > 0) {
    target.hp = Math.max(0, target.hp - final);
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
}

export function handleHeal(
  state: GameState,
  source: any,
  target: any,
  card: Card,
  effect: any
) {
  let heal = effect.value ?? 0;

  const hr = target.statuses.find((s: any) => s.type === "HEAL_REDUCTION");
  if (hr) heal *= 1 - (hr.value ?? 0);

  const final = Math.floor(heal);
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

export function handleDraw(
  state: GameState,
  source: any,
  effect: any
) {
  for (let i = 0; i < (effect.value ?? 0); i++) {
    const c = state.deck.shift();
    if (c) source.hand.push(c);
  }
}

export function handleCleanse(source: any) {
  source.statuses = source.statuses.filter((s: any) => s.type !== "CONTROL");
}

export function handleChannelEffect(
  state: GameState,
  source: any,
  enemy: any,
  card: Card,
  effect: any
) {
  addStatus({
    state,
    sourceUserId: source.userId,
    targetUserId: source.userId,
    card,
    statusTarget: source,
    type: effect.type,
    durationTurns: effect.durationTurns ?? 1,
    breakOnPlay: effect.breakOnPlay,
  });

  if (effect.type === "XINZHENG_CHANNEL") return;

  if (hasUntargetable(enemy)) {
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
    return;
  }

  let dmg = 10;

  const boost = source.statuses.find((s: any) => s.type === "DAMAGE_MULTIPLIER");
  if (boost) dmg *= boost.value ?? 1;

  const dr = enemy.statuses.find((s: any) => s.type === "DAMAGE_REDUCTION");
  if (dr) dmg *= 1 - (dr.value ?? 0);

  dmg = Math.max(0, Math.floor(dmg));
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
