import { GameState } from "./types";

/**
 * Ends the current turn.
 * - Ticks delayed damage
 * - Expires statuses
 * - Checks death
 * - Advances turn + active player
 */
export function resolveTurnEnd(state: GameState) {
  if (state.gameOver) return;

  // Apply end-of-turn status effects
  for (const player of state.players) {
    player.statuses = player.statuses.filter(status => {
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

  // Death check
  for (const player of state.players) {
    if (player.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find(p => p.userId !== player.userId);
      state.winnerUserId = winner?.userId;
      return;
    }
  }

  // Advance turn
  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;
}
