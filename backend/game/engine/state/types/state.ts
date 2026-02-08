// backend/game/engine/state/types/state.ts
// ==================== GAME STATE ====================

import type { PlayerID } from "./common";
import type { CardInstance } from "./cards";
import type { ActiveBuff } from "./buffs";
import type { GameEvent } from "./events";

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
