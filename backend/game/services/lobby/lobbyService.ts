// backend/game/services/lobbyService.ts
/**
 * Lobby lifecycle: create / join / start / get
 */

import GameSession from "../../models/GameSession";
import { GameState } from "../../engine/state/types";
import { buildDeck, shuffle } from "../deck/deck";
import { draw } from "../flow/draw";

export async function createGame(userId: string) {
  const deck = shuffle(buildDeck());

  const state: GameState = {
    turn: 0,
    activePlayerIndex: 0,
    deck,
    discard: [],
    gameOver: false,
    players: [{ userId, hp: 100, hand: [], statuses: [] }],
    events: [],
  };

  draw(state, 0, 6);

  return GameSession.create({
    players: [userId],
    state,
    started: false,
  });
}

export async function joinGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  if (game.players.includes(userId)) return game;
  if (game.players.length >= 2) throw new Error("Game already full");

  game.players.push(userId);
  await game.save();
  return game;
}

export async function startGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.players[0] !== userId) throw new Error("Only host can start");
  if (game.players.length !== 2) throw new Error("Game not ready");

  const deck = shuffle(buildDeck());

  const state: GameState = {
    turn: 0,
    activePlayerIndex: 0,
    deck,
    discard: [],
    gameOver: false,
    players: [
      { userId: game.players[0], hp: 100, hand: [], statuses: [] },
      { userId: game.players[1], hp: 100, hand: [], statuses: [] },
    ],
    events: [],
  };

  draw(state, 0, 6);
  draw(state, 1, 6);

  game.state = state;
  game.started = true;
  await game.save();
  return game;
}

export async function getGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.players.includes(userId)) throw new Error("Not your game");
  return game;
}
