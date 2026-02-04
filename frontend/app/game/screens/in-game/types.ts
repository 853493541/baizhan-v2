/* =========================================================
   Card / Core Types
========================================================= */

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

/* =========================================================
   Status / Buff System (ALIGNED WITH BACKEND)
========================================================= */

export type EffectCategory = "BUFF" | "DEBUFF";

/**
 * Runtime status applied by cards
 */
export interface Status {
  type: string;
  value?: number;
  chance?: number;
  repeatTurns?: number;
  sourceCardId?: string;
  category?: EffectCategory;
  appliedAtTurn: number;
  expiresAtTurn: number;
  breakOnPlay?: boolean;
}

/* =========================================================
   Player State
========================================================= */

export interface PlayerState {
  userId: string;
  hp: number;
  hand: CardInstance[];
  statuses: Status[];
}

/* =========================================================
   Public Game Events (Action History)
========================================================= */

export type GameEventType =
  | "PLAY_CARD"
  | "DAMAGE"
  | "HEAL"
  | "STATUS_APPLIED"
  | "END_TURN";

export interface GameEvent {
  id: string;
  turn: number;
  type: GameEventType;
  actorUserId: string;
  targetUserId?: string;
  cardId?: string;
  cardName?: string;
  value?: number;
  statusType?: string;
  timestamp: number;
}

/* =========================================================
   Game State
========================================================= */

export interface GameState {
  turn: number;
  activePlayerIndex: number;
  deck: CardInstance[];
  discard: CardInstance[];
  gameOver: boolean;
  winnerUserId?: string;
  players: PlayerState[];
  events: GameEvent[];
}

/* =========================================================
   API Response Wrapper
========================================================= */

export interface GameResponse {
  _id: string;
  players: string[];
  state: GameState;
}
