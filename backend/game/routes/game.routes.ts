// backend/game/routes/game.routes.ts
import express from "express";
import jwt from "jsonwebtoken";
import {
  createGame,
  getGame,
  playCard,
  passTurn,
  joinGame,
  startGame,
} from "../services/gameService";
import GameSession from "../models/GameSession";

const router = express.Router();

/* =========================================================
   Auth helper
========================================================= */
function getUserIdFromCookie(req: any): string {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("ERR_NOT_AUTHENTICATED");
  const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
  return payload.uid;
}

/* =========================================================
   CREATE GAME (1 player only)
========================================================= */
router.post("/create", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const game = await createGame(userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   JOIN GAME (via shared link)
========================================================= */
router.post("/join/:id", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const game = await joinGame(req.params.id, userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   START GAME (host only)
========================================================= */
router.post("/start", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId } = req.body;

    const game = await startGame(gameId, userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   WAITING ROOMS
========================================================= */
router.get("/waiting", async (_req, res) => {
  try {
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - TWO_HOURS);

    // 🔥 Global lazy cleanup: delete ANY stale session
    await GameSession.deleteMany({
      updatedAt: { $lt: cutoff },
    });

    // Only return joinable waiting rooms
    const games = await GameSession.find({
      started: false,
      players: { $size: 1 },
    }).sort({ createdAt: -1 });

    res.json(games);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   GET GAME (read-only, public)
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const game = await GameSession.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(game);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   PLAY CARD  🔥 GAMEPLAY ROUTE
   → returns PLAIN TEXT error codes
========================================================= */
router.post("/play", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId, cardInstanceId, targetUserId } = req.body;

    const state = await playCard(
      gameId,
      userId,
      cardInstanceId,
      targetUserId
    );

    res.json(state);
  } catch (err: any) {
    // IMPORTANT: plain text for frontend toast mapping
    res.status(400).send(err.message);
  }
});

/* =========================================================
   PASS TURN  🔥 GAMEPLAY ROUTE
   → returns PLAIN TEXT error codes
========================================================= */
router.post("/pass", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId } = req.body;

    const state = await passTurn(gameId, userId);
    res.json(state);
  } catch (err: any) {
    // IMPORTANT: plain text for frontend toast mapping
    res.status(400).send(err.message);
  }
});

/* =========================================================
   REMATCH
========================================================= */
router.post("/rematch/:id", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const oldGame = await GameSession.findById(req.params.id);
    if (!oldGame) throw new Error("Game not found");

    if (!oldGame.players.includes(userId)) {
      throw new Error("Not your game");
    }

    if (oldGame.players.length !== 2) {
      throw new Error("Invalid game");
    }

    const newGame = await createGame(oldGame.players[0]);
    newGame.players.push(oldGame.players[1]);
    await newGame.save();

    res.json({ gameId: newGame._id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
