// backend/game/engine/state/types.ts

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
 * (no duration logic here)
 */
export type BuffEffect = Omit<CardEffect, "allowWhileControlled"> & {
  /** SCHEDULED_DAMAGE: when this stage fires */
  when?: TurnPhase;

  /** SCHEDULED_DAMAGE: who this stage targets */
  target?: ScheduledTarget;

  /** SCHEDULED_DAMAGE: whose turn this stage belongs to */
  turnOf?: ScheduledTurnOf;
lifestealPct?: number;
  /** DEBUG: stage label shown in events */
  debug?: string;
};

/* ================= Buffs ================= */

export type BuffCategory = "BUFF" | "DEBUFF";
export type BuffApplyTo = "SELF" | "OPPONENT";

/**
 * Buff tick timing
 * - Buffs tick ONLY on the owner's turn boundary.
 */
export type BuffTickOn = TurnPhase;

export interface BuffDefinition {
  buffId: number;

  /** Display name */
  name: string;

  /** BUFF or DEBUFF */
  category: BuffCategory;

  /** Number of ticks before expiry */
  duration: number;

  /** When duration decrements */
  tickOn: BuffTickOn;

  /** Removed when caster plays another card */
  breakOnPlay?: boolean;

  /** Authoritative description */
  description: string;

  /** Engine-only logic payload */
  effects: BuffEffect[];

  /** Optional override for buff recipient */
  applyTo?: BuffApplyTo;

  originalDescription?: string;
}

/* ================= Card ================= */

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;

  /** Immediate effects */
  effects: CardEffect[];

  /** Persistent buffs */
  buffs?: BuffDefinition[];
  originalDescription?: string;
}

/* ================= Runtime ================= */

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export type GameEventType =
  | "PLAY_CARD"
  | "END_TURN"
  | "DAMAGE"
  | "HEAL"
  | "BUFF_APPLIED"
  | "BUFF_EXPIRED";

export interface GameEvent {
  id: string;
  turn: number;
  type: GameEventType;
  actorUserId: PlayerID;
  targetUserId?: PlayerID;

  cardId?: string;
  cardName?: string;

  effectType?: EffectType;
  value?: number;

  buffId?: number;
  buffName?: string;
  buffCategory?: BuffCategory;

  appliedAtTurn?: number;
  expiresAtTurn?: number;

  timestamp: number;
}

export interface ActiveBuff {
  buffId: number;
  name: string;
  category: BuffCategory;

  effects: BuffEffect[];

  sourceCardId?: string;
  sourceCardName?: string;

  /** Remaining ticks until expiry */
  remaining: number;

  /** When this buff decrements */
  tickOn: BuffTickOn;

  /**
   * Runtime cursor for staged SCHEDULED_DAMAGE
   * Each stage runs ONCE, in order
   */
  stageIndex?: number;

  appliedAtTurn?: number;
  breakOnPlay?: boolean;
}

export interface PlayerState {
  userId: PlayerID;
  hp: number;
  hand: CardInstance[];
  buffs: ActiveBuff[];
}

export interface GameState {
  players: PlayerState[];
  deck: CardInstance[];
  discard: CardInstance[];

  turn: number;
  activePlayerIndex: number;

  gameOver: boolean;
  winnerUserId?: PlayerID;

  events: GameEvent[];
}
