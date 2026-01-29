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
  | "DAMAGE_REDUCTION"
  | "DAMAGE_MULTIPLIER"
  | "UNTARGETABLE"
  | "ATTACK_LOCK"
  | "SILENCE"
  | "DELAYED_DAMAGE";

export interface CardEffect {
  type: EffectType;
  value?: number;
  durationTurns?: number;
  repeatTurns?: number;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;
  effects: CardEffect[];
}

export interface Status {
  type: EffectType;
  value?: number;
  expiresAtTurn: number;
  repeatTurns?: number;
  appliedAtTurn: number;
}

export interface PlayerState {
  userId: PlayerID;
  hp: number;
  hand: string[];
  statuses: Status[];
}

export interface GameState {
  players: PlayerState[];
  deck: string[];
  discard: string[];
  turn: number;
  activePlayerIndex: number;

  /** ✅ Endgame */
  gameOver: boolean;
  winnerUserId?: PlayerID;
}
