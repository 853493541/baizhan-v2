import express from "express";
import GameSession from "../models/GameSession";

const router = express.Router();

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

export default router;
