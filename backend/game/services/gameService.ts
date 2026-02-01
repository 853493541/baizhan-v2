// backend/game/services/gameService.ts

import GameSession from "../models/GameSession";
import { CARDS } from "../cards/cards";
import { applyEffects } from "../engine/applyEffects";
import { resolveTurnEnd } from "../engine/turnResolver";
import { validatePlayCard } from "../engine/validateAction";
import { GameState, CardInstance, GameEvent } from "../engine/types";
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
     New deck (PATCH 0.3)
     - 暂时移除：千蝶吐瑞（qiandie_turui）
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

  // 受控可用
  pushN("anchen_misan", 3);

  // 持续伤害 / 节奏
  pushN("fenglai_wushan", 3);
  pushN("wu_jianyu", 2);
  pushN("baizu", 3);

  // 强化 / 爆发
  pushN("nuwa_butian", 2);

  /* ===============================
     PATCH 0.3 新卡加入
  =============================== */
  pushN("fuguang_lueying", 3);
  pushN("jiangchun_zhuxiu", 3);
  pushN("da_shizi_hou", 3);
  pushN("qionglong_huasheng", 3);

  // 注意：ID 由 taxing -> taxingxing（你要求）
  pushN("taxingxing", 3);

  pushN("zhuiming_jian", 3);
  pushN("xinzheng", 2);
  pushN("tiandi_wuji", 3);

  // 驱夜断愁 text change 已在 cards.ts 更新
  pushN("quye_duanchou", 3);

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

/* =========================================================
   PATCH 0.3: draw amount can be reduced by statuses
   - base is 1 per turn
   - DRAW_REDUCTION reduces it (min 0)
   - No draw events (private info)
========================================================= */
function autoDrawAtTurnStart(state: GameState) {
  if (state.gameOver) return;

  const p = state.players[state.activePlayerIndex];
  if (p.hand.length >= 10) return;
  if (state.deck.length === 0) return;

const activeReductions = p.statuses.filter(
  (s) =>
    s.type === "DRAW_REDUCTION" &&
    s.appliedAtTurn <= state.turn &&
    state.turn < s.expiresAtTurn
);

const totalReduction = activeReductions.reduce(
  (sum, s) => sum + (s.value ?? 0),
  0
);

const n = Math.max(0, 1 - totalReduction);

  if (n <= 0) return;

  draw(state, state.activePlayerIndex, n);
}

function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
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
    // ✅ public history log
    events: [],
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
    // ✅ public history log
    events: [],
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

  // ✅ Backward safety: if older games existed without events
  if (!state.events) state.events = [];

  if (state.gameOver) throw new Error("ERR_GAME_OVER");

  const playerIndex = state.players.findIndex((p) => p.userId === userId);
  if (playerIndex === -1) throw new Error("ERR_PLAYER_NOT_IN_GAME");

  // ✅ validate WITHOUT target
  validatePlayCard(state, playerIndex, cardInstanceId);

  const player = state.players[playerIndex];

  const idx = player.hand.findIndex((c) => c.instanceId === cardInstanceId);
  if (idx === -1) throw new Error("ERR_CARD_NOT_IN_HAND");

  const [played] = player.hand.splice(idx, 1);

  const card = CARDS[played.cardId];
  if (!card) throw new Error("ERR_CARD_NOT_FOUND");

  // ===============================
  // TARGET RESOLUTION (AUTHORITATIVE)
  // ===============================
  const targetIndex =
    card.target === "SELF" ? playerIndex : playerIndex === 0 ? 1 : 0;

  const source = state.players[playerIndex];
  const target = state.players[targetIndex];

  // ===============================
  // TARGETING CHECKS
  // ===============================
  const isSelfTarget = playerIndex === targetIndex;

  // Untargetable: absolute cannot be hit by targeted cards
  const targetUntargetable = target.statuses.some((s) => s.type === "UNTARGETABLE");

  // Stealth: cannot be chosen as target by targeted cards
  // (but still takes non-targeted / scheduled/channel damage)
  const targetStealthed = target.statuses.some((s) => s.type === "STEALTH");

  if (!isSelfTarget) {
    if (targetUntargetable) {
      throw new Error("ERR_TARGET_UNTARGETABLE");
    }

    // ✅ Only blocks when the card is actually targeting OPPONENT
    // Channel damage is NOT here; it's scheduled in turnResolver.
    if (targetStealthed && card.target === "OPPONENT") {
      throw new Error("ERR_TARGET_STEALTH");
    }
  }

  /* =========================================================
     PATCH 0.3: 绛唇珠袖触发
     - If the actor has ON_PLAY_DAMAGE status, playing ANY card triggers damage.
     - This happens AFTER validation, before card effects (so it always triggers).
  ========================================================= */
  {
    const triggers = source.statuses.filter((s) => s.type === "ON_PLAY_DAMAGE");
    for (const t of triggers) {
      const dmg = t.value ?? 0;
      if (dmg > 0) {
        source.hp = Math.max(0, source.hp - dmg);

        pushEvent(state, {
          turn: state.turn,
          type: "DAMAGE",
          actorUserId: source.userId,     // actor is the one who played (self damage)
          targetUserId: source.userId,
          cardId: t.sourceCardId,
          cardName: t.sourceCardName,
          effectType: "DAMAGE",
          value: dmg,
        });
      }
    }
  }

  // ✅ public event: card played (opponent should see which card was played)
  pushEvent(state, {
    turn: state.turn,
    type: "PLAY_CARD",
    actorUserId: source.userId,
    targetUserId: target.userId,
    cardId: card.id,
    cardName: card.name,
  });

  // ===============================
  // APPLY EFFECTS
  // ===============================
  applyEffects(state, card, playerIndex, targetIndex);

  state.discard.push(played);

  // end game after self-trigger or effects
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find((x) => x.userId !== p.userId);
      state.winnerUserId = winner?.userId;
    }
  }

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

  // ✅ Backward safety: if older games existed without events
  if (!state.events) state.events = [];

  if (state.gameOver) throw new Error("ERR_GAME_OVER");

  const playerIndex = state.players.findIndex((p) => p.userId === userId);

  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("ERR_NOT_YOUR_TURN");
  }

  // ✅ public event: end turn
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

  return game.state;
}
