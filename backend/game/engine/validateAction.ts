import { GameState } from "./types";
import { CARDS } from "../cards/cards";

export function validatePlayCard(
  state: GameState,
  playerIndex: number,
  targetIndex: number,
  cardInstanceId: string
) {
  if (state.gameOver) {
    throw new Error("Game has ended");
  }

  const player = state.players[playerIndex];
  const target = state.players[targetIndex];

  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("Not your turn");
  }

  const instance = player.hand.find(
    c => c.instanceId === cardInstanceId
  );
  if (!instance) {
    throw new Error("You do not have this card");
  }

  const card = CARDS[instance.cardId];
  if (!card) {
    throw new Error("Card does not exist");
  }

  if (player.statuses.some(s => s.type === "SILENCE")) {
    throw new Error("You are silenced");
  }

  if (
    card.type === "ATTACK" &&
    player.statuses.some(s => s.type === "ATTACK_LOCK")
  ) {
    throw new Error("You cannot play attack cards this turn");
  }

  if (
    card.target === "OPPONENT" &&
    target.statuses.some(s => s.type === "UNTARGETABLE")
  ) {
    throw new Error("Target cannot be targeted");
  }

  if (card.target === "SELF" && playerIndex !== targetIndex) {
    throw new Error("Invalid self target");
  }
}
