import express from "express";
import { playCard, passTurn } from "../services";
import { getUserIdFromCookie } from "./auth";

const router = express.Router();

router.post("/play", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId, cardInstanceId } = req.body;

    const patch = await playCard(gameId, userId, cardInstanceId);
    res.json(patch);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

router.post("/pass", async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { gameId } = req.body;

    const patch = await passTurn(gameId, userId);
    res.json(patch);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

export default router;
