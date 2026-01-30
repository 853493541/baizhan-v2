// backend/game/engine/types.ts

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
  | "ATTACK_LOCK"
  | "SILENCE"
  | "CONTROL_IMMUNE"
  | "DODGE_NEXT"
  | "DELAYED_DAMAGE"
  | "START_TURN_DAMAGE"
  | "START_TURN_HEAL"
  | "CLEANSE";

/** For frontend display only (BUFF/DEBUFF styling) */
export type EffectCategory = "BUFF" | "DEBUFF";

export interface CardEffect {
  type: EffectType;
  value?: number;
  durationTurns?: number;
  repeatTurns?: number;
  chance?: number;
  breakOnPlay?: boolean;
  allowWhileControlled?: boolean;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;
  effects: CardEffect[];
}

/** Card instance in play */
export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export interface Status {
  type: EffectType;
  value?: number;

  /** who created this status (for name/icon in frontend) */
   /** Which card applied this status */
  sourceCardId?: string;
  sourceCardName?: string;

  /** BUFF / DEBUFF tag for frontend rendering */
  category?: EffectCategory;

  appliedAtTurn: number;
  expiresAtTurn: number;
  repeatTurns?: number;
  chance?: number;
  breakOnPlay?: boolean;
}

export interface PlayerState {
  userId: PlayerID;
  hp: number;
  hand: CardInstance[];
  statuses: Status[];
}

export interface GameState {
  players: PlayerState[];
  deck: CardInstance[];
  discard: CardInstance[];
  turn: number;
  activePlayerIndex: number;
  gameOver: boolean;
  winnerUserId?: PlayerID;
}
