import { GameState } from "./types";

export function resolveTurnEnd(state: GameState) {
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

  // End game check
  if (state.players.some(p => p.hp <= 0)) {
    state.gameOver = true;
    return;
  }

  state.turn += 1;
  state.activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;
}
