// backend/game/engine/effects/handlers/handleDraw.ts

import { GameState, CardEffect } from "../../state/types";

export function handleDraw(
  state: GameState,
  source: { hand: any[] },
  effect: CardEffect
) {
  for (let i = 0; i < (effect.value ?? 0); i++) {
    const c = state.deck.shift();
    if (c) source.hand.push(c);
  }
}
