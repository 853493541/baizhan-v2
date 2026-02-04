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
 * Backend source of truth:
 * - appliedAtTurn
 * - expiresAtTurn
 *
 * Frontend derives:
 * - remaining turns
 * - display name / icon
 */
export interface Status {
  /** Engine effect type */
  type: string;

  /** Numeric effect value (damage, heal, reduction, etc.) */
  value?: number;

  /** Proc chance (e.g. dodge) */
  chance?: number;

  /** For delayed / repeated effects */
  repeatTurns?: number;

  /** Which card caused this status (e.g. 生死劫 → 月劫) */
  sourceCardId?: string;

  /** UI classification */
  category?: EffectCategory;

  /** Turn applied */
  appliedAtTurn: number;

  /** Absolute expiration turn */
  expiresAtTurn: number;

  /** Breaks when player plays a card */
  breakOnPlay?: boolean;
}

/* =========================================================
   Player State
========================================================= */

export interface PlayerState {
  userId: string;
  hp: number;
  hand: CardInstance[];

  /**
   * Active buffs / debuffs
   * Never compute remainingTurns here
   * → always derive from GameState.turn
   */
  statuses: Status[];
}

/* =========================================================
   Game State
========================================================= */

export interface GameState {
  /** Global turn counter */
  turn: number;

  /** Whose turn it is */
  activePlayerIndex: number;

  deck: CardInstance[];
  discard: CardInstance[];

  gameOver: boolean;

  players: PlayerState[];
}

/* =========================================================
   API Response Wrapper
========================================================= */

export interface GameResponse {
  _id: string;
  players: string[];
  state: GameState;
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

/**
 * Public, authoritative game event.
 * Must NOT contain hidden information (e.g. opponent hand).
 */
export interface GameEvent {
  id: string;

  /** Turn when this event happened */
  turn: number;

  /** Event semantic type */
  type: GameEventType;

  /** Who caused the event */
  actorUserId: string;

  /** Who received the effect (if applicable) */
  targetUserId?: string;

  /** Card info (only for visible actions) */
  cardId?: string;
  cardName?: string;

  /** Numeric value (damage / heal) */
  value?: number;

  /** Status applied (if any) */
  statusType?: string;

  /** For ordering / animation */
  timestamp: number;
}
export interface GameState {
  /** Global turn counter */
  turn: number;

  /** Whose turn it is */
  activePlayerIndex: number;

  deck: CardInstance[];
  discard: CardInstance[];

  gameOver: boolean;

  players: PlayerState[];

  /** ✅ Public action history */
  events: GameEvent[];
}
