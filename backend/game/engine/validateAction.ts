// backend/game/engine/validateAction.ts
import { GameState } from "./types";
import { CARDS } from "../cards/cards";

/* =========================================================
   VALIDATE PLAY CARD
   - Targeting is resolved by backend service
   - Validation only checks legality of play
========================================================= */
export function validatePlayCard(
  state: GameState,
  playerIndex: number,
  cardInstanceId: string
) {
  if (state.gameOver) throw new Error("Game has ended");

  if (state.activePlayerIndex !== playerIndex)
    throw new Error("Not your turn");

  const player = state.players[playerIndex];

  const instance = player.hand.find(c => c.instanceId === cardInstanceId);
  if (!instance) throw new Error("You do not have this card");

  const card = CARDS[instance.cardId];
  if (!card) throw new Error("Card does not exist");

const isSilenced = player.statuses.some(s => s.type === "SILENCE");
if (isSilenced) {
  throw new Error("You are silenced");
}

const isControlled = player.statuses.some(
  s => s.type === "CONTROL" || s.type === "ATTACK_LOCK"
);

const allowsOverride = card.effects.some(
  e => e.allowWhileControlled
);

if (isControlled && !allowsOverride) {
  throw new Error("You are controlled");
}

  // ❌ NO TARGET VALIDATION HERE ANYMORE
}
