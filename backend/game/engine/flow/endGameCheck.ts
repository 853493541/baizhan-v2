// engine/flow/endGameCheck.ts
import { GameState } from "../state/types";

export function checkEndGame(state: GameState) {
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      state.winnerUserId = state.players.find(
        (x) => x.userId !== p.userId
      )?.userId;
      return;
    }
  }
}
