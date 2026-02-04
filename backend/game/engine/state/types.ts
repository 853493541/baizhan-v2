// backend/game/engine/state/types.ts

export type PlayerID = string;

export type CardType =
  | "ATTACK"
  | "SUPPORT"
  | "CONTROL"
  | "STANCE"
  | "CHANNEL";

export type TargetType = "SELF" | "OPPONENT";

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

/** For display grouping only */
export type BuffCategory = "BUFF" | "DEBUFF";

export interface CardEffect {
  type: EffectType;

  value?: number;
  durationTurns?: number;
  repeatTurns?: number;
  chance?: number;

  /** If true, the buff (or effect) ends when THE OWNER plays a card */
  breakOnPlay?: boolean;

  /** If true, this effect allows the card to be played while CONTROLLED */
  allowWhileControlled?: boolean;

  /** per-effect target override */
  applyTo?: TargetType;

  /** BONUS_DAMAGE_IF_TARGET_HP_GT */
  threshold?: number;
}

/**
 * BuffEffect is the same runtime shape as CardEffect,
 * but stored under buffs (persistent).
 */
export type BuffEffect = Omit<CardEffect, "allowWhileControlled">;

export interface BuffDefinition {
  /** internal stable id (number) */
  buffId: number;

  /** display name (Chinese) */
  name: string;

  category: BuffCategory;

  /** how long this buff lasts */
  durationTurns: number;

  /** if true, removed when OWNER plays any card */
  breakOnPlay?: boolean;

  /** effects carried by this buff */
  effects: BuffEffect[];
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;

  /** immediate effects (resolve now) */
  effects: CardEffect[];

  /** buffs applied by this card (persist) */
  buffs?: BuffDefinition[];
}

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

  /** buff payload */
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

  /** ✅ new */
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
