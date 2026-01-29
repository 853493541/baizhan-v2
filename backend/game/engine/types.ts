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
  id: string;          // card template id (e.g. "strike")
  name: string;
  type: CardType;
  target: TargetType;
  effects: CardEffect[];
}

/** ✅ Card instance in play */
export interface CardInstance {
  instanceId: string;  // unique per card
  cardId: string;      // reference to CARDS key
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
