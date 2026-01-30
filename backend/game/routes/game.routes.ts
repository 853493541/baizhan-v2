import express from "express";
import jwt from "jsonwebtoken";
import {
  createGame,
  getGame,
  playCard,
  passTurn,
  joinGame,
  startGame, // ✅ IMPORT FROM SERVICE
} from "../services/gameService";
import GameSession from "../models/GameSession";
const router = express.Router();

/* =========================================================
   Auth helper
========================================================= */
function getUserIdFromCookie(req: any): string {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Not authenticated");
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
   START GAME (initialize state)
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

router.get("/waiting", async (_req, res) => {
  try {
    const games = await GameSession.find({
      players: { $size: 1 }
    }).sort({ createdAt: -1 });

    res.json(games);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   GET GAME
========================================================= */
/* =========================================================
   GET GAME (PUBLIC — anyone can read room)
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
   PLAY CARD
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
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   PASS TURN
========================================================= */
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
// List games waiting for player 2


export default router;
