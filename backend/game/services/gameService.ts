// backend/game/services/gameService.ts
import GameSession from "../models/GameSession";
import { CARDS } from "../cards/cards";
import { applyEffects } from "../engine/applyEffects";
import { resolveTurnEnd } from "../engine/turnResolver";
import { validatePlayCard } from "../engine/validateAction";
import { GameState } from "../engine/types";

/* =========================================================
   Deck composition (Total 36)
   - strike: 10
   - heal_dr: 6
   - disengage: 5
   - channel: 5
   - power_surge: 5
   - silence: 5
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

export async function createGame(
  userId: string,
  opponentUserId: string
) {
  if (!userId || !opponentUserId) {
    throw new Error("Missing players");
  }
  if (userId === opponentUserId) {
    throw new Error("Cannot play against yourself");
  }

  // Ensure all referenced cards exist
  for (const id of Object.keys(CARDS)) {
    if (!CARDS[id]) throw new Error(`Missing card def: ${id}`);
  }

  const deck = shuffle(buildDeck());

  const state: GameState = {
    turn: 0,
    activePlayerIndex: 0,
    deck,
    discard: [],
    players: [
      { userId, hp: 100, hand: [], statuses: [] },
      { userId: opponentUserId, hp: 100, hand: [], statuses: [] }
    ]
  };

  // Starting hand = 6 each
  draw(state, 0, 6);
  draw(state, 1, 6);

  const game = await GameSession.create({
    players: [userId, opponentUserId],
    state
  });

  return game;
}

export async function getGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  if (!game.players.includes(userId)) {
    throw new Error("Not your game");
  }

  return game;
}

export async function playCard(
  gameId: string,
  userId: string,
  cardId: string,
  targetUserId: string
) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  if (!game.players.includes(userId)) {
    throw new Error("Not your game");
  }

  const state = game.state as GameState;

  const playerIndex = state.players.findIndex(p => p.userId === userId);
  const targetIndex = state.players.findIndex(p => p.userId === targetUserId);

  if (playerIndex === -1 || targetIndex === -1) {
    throw new Error("Invalid player");
  }

  const card = CARDS[cardId];
  if (!card) throw new Error("Invalid card");

  validatePlayCard(state, playerIndex, targetIndex, cardId);

  // Apply effects
  applyEffects(state, card, playerIndex, targetIndex);

  // Move card to discard (remove from hand first)
  state.players[playerIndex].hand =
    state.players[playerIndex].hand.filter(c => c !== cardId);
  state.discard.push(cardId);

  // End turn
  resolveTurnEnd(state);

  // Draw rule: draw 1 at start of active player's turn, max hand 10
  const nextPlayer = state.players[state.activePlayerIndex];
  if (nextPlayer.hand.length < 10) {
    const top = state.deck.shift();
    if (top) nextPlayer.hand.push(top);
  }

  // Persist
  game.state = state;
  await game.save();

  return state;
}
