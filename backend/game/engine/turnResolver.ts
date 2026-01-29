// backend/game/engine/turnResolver.ts
import { GameState } from "./types";

export function resolveTurnEnd(state: GameState) {
  for (const player of state.players) {
    player.statuses = player.statuses.filter(status => {
      // Delayed damage ticks only if status existed before this turn
      if (
        status.type === "DELAYED_DAMAGE" &&
        status.repeatTurns &&
        status.repeatTurns > 0 &&
        status.appliedAtTurn < state.turn
      ) {
        player.hp = Math.max(0, player.hp - (status.value ?? 0));
        status.repeatTurns -= 1;
      }

      return state.turn < status.expiresAtTurn;
    });
  }

  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;
}
