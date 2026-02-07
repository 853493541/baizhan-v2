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
} from "../services";
import GameSession from "../models/GameSession";
import { CARDS } from "../cards/cards";

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
   🔥 PRELOAD GAME DATA (MUST BE ABOVE /:id)
========================================================= */

import { buildCardPreload } from "../cards/cardPreload";

router.get("/preload", (_req, res) => {
  try {
    // 🔑 single source of truth
    const preload = buildCardPreload();

    // MUST return preload directly
    // NOT wrapped, NOT reshaped here
    res.json(preload);
  } catch (err: any) {
    console.error("[PRELOAD] failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   CREATE GAME
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
   JOIN GAME
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
   START GAME
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

    await GameSession.deleteMany({
      updatedAt: { $lt: cutoff },
    });

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
   GET GAME (FULL SNAPSHOT — MUST BE LAST)
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
   PLAY CARD (DIFF RESPONSE)
========================================================= */
router.post("/play", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId, cardInstanceId } = req.body;

    // ⬇️ now returns { version, diff }
    const patch = await playCard(gameId, userId, cardInstanceId);
    res.json(patch);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

/* =========================================================
   PASS TURN (DIFF RESPONSE)
========================================================= */
router.post("/pass", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId } = req.body;

    // ⬇️ now returns { version, diff }
    const patch = await passTurn(gameId, userId);
    res.json(patch);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

export default router;
/* =========================================================
   POLL DIFF (OPPONENT ACTIONS)
========================================================= */
router.get("/:id/diff", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const sinceVersion = Number(req.query.sinceVersion ?? 0);

    const game = await GameSession.findById(req.params.id);
    if (!game || !game.state) {
      return res.status(404).json({ error: "Game not found" });
    }

    const state = game.state;

    if (state.version <= sinceVersion) {
      return res.json({ version: state.version, diff: [] });
    }

    // full diff from previous known version is acceptable for now
    res.json({
      version: state.version,
      diff: [
        { path: "/", value: state },
      ],
    });
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});
