import GameSession from "../models/GameSession";
import { CARDS } from "../cards/cards";
import { applyEffects } from "../engine/applyEffects";
import { resolveTurnEnd } from "../engine/turnResolver";
import { validatePlayCard } from "../engine/validateAction";
import { GameState, CardInstance } from "../engine/types";
import { randomUUID } from "crypto";

/* =========================================================
   Deck composition
========================================================= */
function buildDeck(): CardInstance[] {
  const deck: CardInstance[] = [];

  const pushN = (cardId: string, n: number) => {
    for (let i = 0; i < n; i++) {
      deck.push({
        instanceId: randomUUID(),
        cardId
      });
    }
  };

  pushN("strike", 10);
  pushN("heal_dr", 6);
  pushN("disengage", 5);
  pushN("channel", 5);
  pushN("power_surge", 5);
  pushN("silence", 5);

  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function draw(state: GameState, playerIndex: number, n: number) {
  for (let i = 0; i < n; i++) {
    const top = state.deck.shift();
    if (!top) break;
    state.players[playerIndex].hand.push(top);
  }
}

function autoDrawAtTurnStart(state: GameState) {
  if (state.gameOver) return;

  const p = state.players[state.activePlayerIndex];
  if (p.hand.length > 0) return;
  if (p.hand.length >= 10) return;
  if (state.deck.length === 0) return;

  draw(state, state.activePlayerIndex, 1);
}

/* =========================================================
   CREATE GAME (LOBBY ONLY)
========================================================= */
export async function createGame(userId: string) {
  const deck = shuffle(buildDeck());

  const state: GameState = {
    turn: 0,
    activePlayerIndex: 0,
    deck,
    discard: [],
    gameOver: false,
    winnerUserId: undefined,
    players: [
      { userId, hp: 100, hand: [], statuses: [] }
    ],
  };

  draw(state, 0, 6);

  return GameSession.create({
    players: [userId],   // ✅ ONLY creator
    state,               // ✅ REQUIRED
  });
}

/* =========================================================
   JOIN GAME
========================================================= */
export async function joinGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  if (game.players.includes(userId)) return game;
  if (game.players.length >= 2) throw new Error("Game already full");

  game.players.push(userId);
  await game.save();

  return game;
}

/* =========================================================
   START GAME (INITIALIZE STATE)
========================================================= */
export async function startGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  // ❌ Only host can start
  if (game.players[0] !== userId) {
    throw new Error("Only host can start the game");
  }

  // ❌ Must have exactly 2 players
  if (game.players.length !== 2) {
    throw new Error("Game not ready");
  }

  // ✅ Already started → return as-is
  if (game.started) return game;

  const deck = shuffle(buildDeck());

  const state: GameState = {
    turn: 0,
    activePlayerIndex: 0,
    deck,
    discard: [],
    gameOver: false,
    winnerUserId: undefined,
    players: [
      { userId: game.players[0], hp: 100, hand: [], statuses: [] },
      { userId: game.players[1], hp: 100, hand: [], statuses: [] },
    ],
  };

  draw(state, 0, 6);
  draw(state, 1, 6);

  // ✅ THESE TWO LINES FIX THE REDIRECT
  game.state = state;
  game.started = true;

  await game.save();
  return game;
}

/* =========================================================
   GET GAME
========================================================= */
export async function getGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.players.includes(userId)) throw new Error("Not your game");
  return game;
}

/* =========================================================
   PLAY CARD
========================================================= */
export async function playCard(
  gameId: string,
  userId: string,
  cardInstanceId: string,
  targetUserId: string
) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.state) throw new Error("Game not started");

  const state = game.state as GameState;
  if (state.gameOver) throw new Error("Game over");

  const playerIndex = state.players.findIndex(p => p.userId === userId);
  const targetIndex = state.players.findIndex(p => p.userId === targetUserId);

  validatePlayCard(state, playerIndex, targetIndex, cardInstanceId);

  const player = state.players[playerIndex];
  const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) throw new Error("Card not in hand");

  const [played] = player.hand.splice(idx, 1);
  const card = CARDS[played.cardId];

  applyEffects(state, card, playerIndex, targetIndex);
  state.discard.push(played);

  game.state = state;
  game.markModified("state");
  await game.save();

  return game.state;
}

/* =========================================================
   PASS TURN
========================================================= */
export async function passTurn(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.state) throw new Error("Game not started");

  const state = game.state as GameState;
  if (state.gameOver) throw new Error("Game over");

  const playerIndex = state.players.findIndex(p => p.userId === userId);
  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("Not your turn");
  }

  resolveTurnEnd(state);
  autoDrawAtTurnStart(state);

  game.state = state;
  game.markModified("state");
  await game.save();

  return game.state;
}
