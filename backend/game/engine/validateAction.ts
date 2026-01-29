// backend/game/engine/validateAction.ts
import { GameState } from "./types";
import { CARDS } from "../cards/cards";

export function validatePlayCard(
  state: GameState,
  playerIndex: number,
  targetIndex: number,
  cardId: string
) {
  const player = state.players[playerIndex];
  const target = state.players[targetIndex];
  const card = CARDS[cardId];

  if (!card) throw new Error("Card does not exist");

  // Turn ownership
  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("Not your turn");
  }

  // Must have card in hand
  if (!player.hand.includes(cardId)) {
    throw new Error("You do not have this card");
  }

  // Silence blocks all play
  if (player.statuses.some(s => s.type === "SILENCE")) {
    throw new Error("You are silenced");
  }

  // Attack lock blocks ATTACK cards
  if (card.type === "ATTACK" && player.statuses.some(s => s.type === "ATTACK_LOCK")) {
    throw new Error("You cannot play attack cards this turn");
  }

  // Opponent target must not be untargetable
  if (card.target === "OPPONENT" && target.statuses.some(s => s.type === "UNTARGETABLE")) {
    throw new Error("Target cannot be targeted");
  }

  // Self target must match same player
  if (card.target === "SELF" && playerIndex !== targetIndex) {
    throw new Error("Invalid self target");
  }
}
