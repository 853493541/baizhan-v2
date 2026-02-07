export type PlayerID = string;

/* ================= Scheduling ================= */

export type TurnPhase = "TURN_START" | "TURN_END";
export type ScheduledTarget = "ENEMY" | "SELF";
export type ScheduledTurnOf = "OWNER" | "ENEMY";

/* ================= Card ================= */

export type CardType =
  | "ATTACK"
  | "SUPPORT"
  | "CONTROL"
  | "STANCE"
  | "CHANNEL";

export type TargetType = "SELF" | "OPPONENT";

/* ================= Effects ================= */

export type EffectType =
  | "DAMAGE"
  | "HEAL"
  | "DRAW"
  | "DAMAGE_REDUCTION"
  | "DAMAGE_MULTIPLIER"
  | "HEAL_REDUCTION"
  | "UNTARGETABLE"
  | "STEALTH"
  | "ATTACK_LOCK"
  | "CONTROL"
  | "SILENCE"
  | "CONTROL_IMMUNE"
  | "DODGE_NEXT"
  | "DELAYED_DAMAGE"
  | "START_TURN_DAMAGE"
  | "START_TURN_HEAL"
  | "CLEANSE"
  | "FENGLAI_CHANNEL"
  | "WUJIAN_CHANNEL"
  | "DRAW_REDUCTION"
  | "ON_PLAY_DAMAGE"
  | "XINZHENG_CHANNEL"
  | "BONUS_DAMAGE_IF_TARGET_HP_GT"
  | "SCHEDULED_DAMAGE";

/**
 * Immediate card effects
 */
export interface CardEffect {
  type: EffectType;
  value?: number;
  chance?: number;
  repeatTurns?: number;

  /** card can be played while controlled */
  allowWhileControlled?: boolean;

  /** per-effect target override */
  applyTo?: TargetType;

  /** BONUS_DAMAGE_IF_TARGET_HP_GT */
  threshold?: number;
}

/**
 * Buff-contained effects
 */
export type BuffEffect = Omit<CardEffect, "allowWhileControlled"> & {
  when?: TurnPhase;
  target?: ScheduledTarget;
  turnOf?: ScheduledTurnOf;

  lifestealPct?: number;

  /** DEBUG: stage label shown in events */
  debug?: string;
};

/* ================= Buffs ================= */

export type BuffCategory = "BUFF" | "DEBUFF";
export type BuffApplyTo = "SELF" | "OPPONENT";

export type BuffTickOn = TurnPhase;

export interface BuffDefinition {
  buffId: number;
  name: string;
  category: BuffCategory;
  duration: number;
  tickOn: BuffTickOn;
  breakOnPlay?: boolean;
  description: string;
  effects: BuffEffect[];
  applyTo?: BuffApplyTo;
  originalDescription?: string;
}

/* ================= Card ================= */

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;
  effects: CardEffect[];
  buffs?: BuffDefinition[];
  originalDescription?: string;
}

/* ================= Runtime ================= */

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

/* ================= Events ================= */

export type GameEventType =
  | "PLAY_CARD"
  | "END_TURN"
  | "DAMAGE"
  | "HEAL"
  | "BUFF_APPLIED"
  | "BUFF_EXPIRED";

export interface GameEvent {
  id: string;
  timestamp: number;

  turn: number;
  type: GameEventType;

  actorUserId: PlayerID;
  targetUserId?: PlayerID;

  /** Card play */
  cardId?: string;
  cardName?: string;
  cardInstanceId?: string;

  /** Damage / heal */
  effectType?: EffectType;
  value?: number;

  /** Buff */
  buffId?: number;
  buffName?: string;
  buffCategory?: BuffCategory;

  appliedAtTurn?: number;
  expiresAtTurn?: number;
}

/* ================= Active Buff ================= */

export interface ActiveBuff {
  buffId: number;
  name: string;
  category: BuffCategory;

  effects: BuffEffect[];

  sourceCardId?: string;
  sourceCardName?: string;

  remaining: number;
  tickOn: BuffTickOn;

  stageIndex?: number;
  appliedAtTurn?: number;
  breakOnPlay?: boolean;
}

/* ================= Player / State ================= */

export interface PlayerState {
  userId: PlayerID;
  hp: number;
  hand: CardInstance[];
  buffs: ActiveBuff[];
}

export interface GameState {
  version: number;

  players: PlayerState[];
  deck: CardInstance[];
  discard: CardInstance[];

  turn: number;
  activePlayerIndex: number;

  gameOver: boolean;
  winnerUserId?: PlayerID;

  events: GameEvent[];
}
