// backend/game/engine/turnResolver.ts
import { GameState } from "./types";

export function resolveTurnEnd(state: GameState) {
  if (state.gameOver) return;

  for (const player of state.players) {
    player.statuses = player.statuses.filter(status => {
      // END TURN DAMAGE
      if (status.type === "DELAYED_DAMAGE" && status.repeatTurns! > 0) {
        player.hp = Math.max(0, player.hp - (status.value ?? 0));
        status.repeatTurns!--;
      }

      // START TURN DAMAGE / HEAL
      if (status.type === "START_TURN_DAMAGE") {
        player.hp = Math.max(0, player.hp - (status.value ?? 0));
      }

      if (status.type === "START_TURN_HEAL") {
        player.hp = Math.min(100, player.hp + (status.value ?? 0));
      }

      return state.turn < status.expiresAtTurn;
    });
  }

  for (const player of state.players) {
    if (player.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find(
        p => p.userId !== player.userId
      );
      state.winnerUserId = winner?.userId;
      return;
    }
  }

  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;
}
