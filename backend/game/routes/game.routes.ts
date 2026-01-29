import express from "express";
import jwt from "jsonwebtoken";
import { createGame, getGame, playCard, passTurn } from "../services/gameService";

const router = express.Router();

function getUserIdFromCookie(req: any): string {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Not authenticated");
  const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
  return payload.uid;
}

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

router.get("/:id", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const game = await getGame(req.params.id, userId);
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

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
    res.status(400).json({ error: err.message });
  }
});

router.post("/pass", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId } = req.body;
    const state = await passTurn(gameId, userId);
    res.json(state);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
