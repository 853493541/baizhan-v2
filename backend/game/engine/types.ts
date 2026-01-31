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
  | "WUJIAN_CHANNEL";

/** For frontend display only */
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

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export type GameEventType =
  | "PLAY_CARD"
  | "END_TURN"
  | "DAMAGE"
  | "HEAL"
  | "STATUS_APPLIED";

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
  statusType?: EffectType;
  appliedAtTurn?: number;
  expiresAtTurn?: number;
  timestamp: number;
}

export interface Status {
  type: EffectType;
  value?: number;
  sourceCardId?: string;
  sourceCardName?: string;
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
  events: GameEvent[];
}
