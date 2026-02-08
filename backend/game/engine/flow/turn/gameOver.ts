// backend/game/engine/flow/turn/gameOver.ts

import { GameState } from "../../state/types";

export function checkGameOver(state: GameState) {
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId =
        state.players.find((x) => x.userId !== p.userId)?.userId;
      return true;
    }
  }
  return false;
}
