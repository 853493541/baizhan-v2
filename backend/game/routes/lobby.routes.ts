import express from "express";
import {
  createGame,
  joinGame,
  startGame,
} from "../services";
import GameSession from "../models/GameSession";
import { getUserIdFromCookie } from "./auth";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const game = await createGame(userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/join/:id", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const game = await joinGame(req.params.id, userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

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

export default router;
