import GameSession from "../models/GameSession";
import { CARDS } from "../cards/cards";
import { applyEffects } from "../engine/applyEffects";
import { resolveTurnEnd } from "../engine/turnResolver";
import { validatePlayCard } from "../engine/validateAction";
import { GameState } from "../engine/types";

/* =========================================================
   Deck composition (Total 36)
========================================================= */
function buildDeck(): string[] {
  const deck: string[] = [];
  const pushN = (id: string, n: number) => {
    for (let i = 0; i < n; i++) deck.push(id);
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
   CREATE GAME
========================================================= */
export async function createGame(userId: string, opponentUserId: string) {
  const deck = shuffle(buildDeck());

  const state: GameState = {
    turn: 0,
    activePlayerIndex: 0,
    deck,
    discard: [],
    gameOver: false,
    winnerUserId: undefined,
    players: [
      { userId, hp: 100, hand: [], statuses: [] },
      { userId: opponentUserId, hp: 100, hand: [], statuses: [] },
    ],
  };

  draw(state, 0, 6);
  draw(state, 1, 6);

  return GameSession.create({
    players: [userId, opponentUserId],
    state,
  });
}

export async function getGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.players.includes(userId)) throw new Error("Not your game");
  return game;
}

/* =========================================================
   PLAY CARD (DOES NOT END TURN)
========================================================= */
export async function playCard(
  gameId: string,
  userId: string,
  cardId: string,
  targetUserId: string
) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  const state = game.state as GameState;
  if (state.gameOver) throw new Error("Game over");

  const playerIndex = state.players.findIndex(p => p.userId === userId);
  const targetIndex = state.players.findIndex(p => p.userId === targetUserId);

  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("Not your turn");
  }

  const card = CARDS[cardId];
  if (!card) throw new Error("Invalid card");

  validatePlayCard(state, playerIndex, targetIndex, cardId);
  applyEffects(state, card, playerIndex, targetIndex);

  const idx = state.players[playerIndex].hand.indexOf(cardId);
  if (idx === -1) throw new Error("Card not in hand");

  state.players[playerIndex].hand.splice(idx, 1);
  state.discard.push(cardId);

  const dead = state.players.find(p => p.hp <= 0);
  if (dead) {
    state.gameOver = true;
    state.winnerUserId =
      state.players.find(p => p.userId !== dead.userId)?.userId;
  }

  game.state = state;
  game.markModified("state");
  await game.save();

  return game.state;
}

/* =========================================================
   PASS TURN (ENDS TURN)
========================================================= */
export async function passTurn(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

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
