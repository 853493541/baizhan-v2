export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export interface PlayerState {
  userId: string;
  hp: number;
  hand: CardInstance[];
  statuses: any[];
}

export interface GameState {
  turn: number;
  activePlayerIndex: number;
  deck: CardInstance[];
  discard: CardInstance[];
  gameOver: boolean;
  players: PlayerState[];
}

export interface GameResponse {
  _id: string;
  players: string[];
  state: GameState;
}
