// backend/game/routes/game.routes.ts
import express from "express";
import jwt from "jsonwebtoken";
import { createGame, getGame, playCard } from "../services/gameService";

const router = express.Router();

function getUserIdFromCookie(req: any): string {
  const token = req.cookies?.auth_token;
  if (!token) {
    throw new Error("Not authenticated");
  }

  const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
  return payload.uid;
}

/**
 * POST /game/create
 * body: { opponentUserId: string }
 */
router.post("/create", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { opponentUserId } = req.body;

    const game = await createGame(userId, opponentUserId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /game/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const gameId = req.params.id;

    const game = await getGame(gameId, userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /game/play
 * body: { gameId, cardId, targetUserId }
 */
router.post("/play", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId, cardId, targetUserId } = req.body;

    const state = await playCard(gameId, userId, cardId, targetUserId);
    res.json(state);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
