// backend/game/engine/state/types.ts

export type PlayerID = string;

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
  | "BONUS_DAMAGE_IF_TARGET_HP_GT";

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
 * Buff-contained effects (no play rules, no duration)
 */
export type BuffEffect = Omit<
  CardEffect,
  "allowWhileControlled"
>;

/* ================= Buffs ================= */

export type BuffCategory = "BUFF" | "DEBUFF";

export interface BuffDefinition {
  buffId: number;

  /** Display name shown to player */
  name: string;

  /** BUFF or DEBUFF – authoritative, no inference on frontend */
  category: "BUFF" | "DEBUFF";

  /** How long this buff exists */
  durationTurns: number;

  /** Optional: removed when a card is played */
  breakOnPlay?: boolean;

  /** 🧠 AUTHORITATIVE TEXT (no frontend building) */
  description: string;

  /** Engine-only logic payload */
  effects: BuffEffect[];
}

/* ================= Card ================= */

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;

  /** resolve immediately */
  effects: CardEffect[];

  /** persistent effects */
  buffs?: BuffDefinition[];
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

  appliedAtTurn: number;
  expiresAtTurn: number;

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
