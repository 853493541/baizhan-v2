// backend/game/services/draw.ts
/**
 * Card draw logic.
 * Includes DRAW_REDUCTION handling.
 */

import { GameState } from "../../engine/state/types";

export function draw(state: GameState, playerIndex: number, n: number) {
  for (let i = 0; i < n; i++) {
    const top = state.deck.shift();
    if (!top) break;
    state.players[playerIndex].hand.push(top);
  }
}

export function autoDrawAtTurnStart(state: GameState) {
  if (state.gameOver) return;

  const p = state.players[state.activePlayerIndex];
  if (p.hand.length >= 10) return;
  if (state.deck.length === 0) return;

  const reductions = p.statuses.filter(
    (s) =>
      s.type === "DRAW_REDUCTION" &&
      s.appliedAtTurn <= state.turn &&
      state.turn < s.expiresAtTurn
  );

  const totalReduction = reductions.reduce(
    (sum, s) => sum + (s.value ?? 0),
    0
  );

  const n = Math.max(0, 1 - totalReduction);
  if (n > 0) {
    draw(state, state.activePlayerIndex, n);
  }
}
