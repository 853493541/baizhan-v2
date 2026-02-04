// backend/game/services/playService.ts
/**
 * Gameplay actions: play card / pass turn
 */

import GameSession from "../../models/GameSession";
import { CARDS } from "../../cards/cards";
import { applyEffects } from "../../engine/flow/applyEffects";
import { resolveTurnEnd } from "../../engine/flow/turnResolver";
import { validatePlayCard } from "../../engine/rules/validateAction";
import { GameState } from "../../engine/state/types";
import { autoDrawAtTurnStart } from "../flow/draw";
import { pushEvent } from "../flow/events";

export async function playCard(
  gameId: string,
  userId: string,
  cardInstanceId: string
) {
  const game = await GameSession.findById(gameId);
  if (!game || !game.state) throw new Error("Game not found");

  const state = game.state as GameState;
  if (!state.events) state.events = [];

  const playerIndex = state.players.findIndex((p) => p.userId === userId);
  validatePlayCard(state, playerIndex, cardInstanceId);

  const player = state.players[playerIndex];
  const idx = player.hand.findIndex((c) => c.instanceId === cardInstanceId);
  const [played] = player.hand.splice(idx, 1);

  const card = CARDS[played.cardId];
  const targetIndex =
    card.target === "SELF" ? playerIndex : playerIndex === 0 ? 1 : 0;

  pushEvent(state, {
    turn: state.turn,
    type: "PLAY_CARD",
    actorUserId: userId,
    targetUserId: state.players[targetIndex].userId,
    cardId: card.id,
    cardName: card.name,
  });

  applyEffects(state, card, playerIndex, targetIndex);
  state.discard.push(played);

  game.state = state;
  game.markModified("state");
  await game.save();
  return state;
}

export async function passTurn(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game || !game.state) throw new Error("Game not found");

  const state = game.state as GameState;

  pushEvent(state, {
    turn: state.turn,
    type: "END_TURN",
    actorUserId: userId,
  });

  resolveTurnEnd(state);
  autoDrawAtTurnStart(state);

  game.state = state;
  game.markModified("state");
  await game.save();
  return state;
}
