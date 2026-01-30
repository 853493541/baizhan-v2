// backend/game/services/gameService.ts

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
    if (!CARDS[cardId]) {
      throw new Error(`Unknown card id in deck: ${cardId}`);
    }

    for (let i = 0; i < n; i++) {
      deck.push({
        instanceId: randomUUID(),
        cardId,
      });
    }
  };

  /* ===============================
     New 15-card deck
  =============================== */

  // 基础攻击
  pushN("jianpo_xukong", 6);
  pushN("sanhuan_taoyue", 6);

  // 控制 / 压制
  pushN("mohe_wuliang", 4);
  pushN("shengsi_jie", 4);
  pushN("chan_xiao", 4);

  // 解控 / 防御
  pushN("jiru_feng", 4);
  pushN("sanliu_xia", 4);
  pushN("que_ta_zhi", 3);

  // 生存 / 回复
  pushN("fengxiu_diang", 4);
  pushN("qiandie_turui", 3);

  // 受控可用
  pushN("anchen_misan", 3);

  // 持续伤害 / 节奏
  pushN("fenglai_wushan", 3);
  pushN("wu_jianyu", 2);
  pushN("baizu", 3);

  // 强化 / 爆发
  pushN("nuwa_butian", 2);

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
    players: [{ userId, hp: 100, hand: [], statuses: [] }],
  };

  draw(state, 0, 6);

  return GameSession.create({
    players: [userId],
    state,
    started: false,
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
   START GAME (HOST ONLY)
========================================================= */
export async function startGame(gameId: string, userId: string) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");

  if (game.players[0] !== userId) {
    throw new Error("Only host can start the game");
  }

  if (game.players.length !== 2) {
    throw new Error("Game not ready");
  }

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
  _targetUserId: string // ignored now
) {
  const game = await GameSession.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.state) throw new Error("Game not started");

  const state = game.state as GameState;
  if (state.gameOver) throw new Error("Game over");

  const playerIndex = state.players.findIndex(p => p.userId === userId);
  if (playerIndex === -1) throw new Error("Player not in game");

  // ✅ validate WITHOUT target
  validatePlayCard(state, playerIndex, cardInstanceId);

  const player = state.players[playerIndex];
  const idx = player.hand.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) throw new Error("Card not in hand");

  const [played] = player.hand.splice(idx, 1);
  const card = CARDS[played.cardId];
  if (!card) throw new Error("Card definition missing");

  // ✅ TARGET RESOLUTION HAPPENS HERE (AUTHORITATIVE)
  const targetIndex =
    card.target === "SELF"
      ? playerIndex
      : playerIndex === 0
      ? 1
      : 0;




 const source = state.players[playerIndex];
  const target = state.players[targetIndex];

  // ===============================
  // UNTARGETABLE CHECK
  // ===============================
  const isSelfTarget = playerIndex === targetIndex;

  const targetUntargetable = target.statuses.some(
    s => s.type === "UNTARGETABLE"
  );

  if (targetUntargetable && !isSelfTarget) {
    throw new Error("Target is untargetable");
  }



  
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
