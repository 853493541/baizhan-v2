// backend/game/models/GameSession.ts
import mongoose from "mongoose";

const GameSessionSchema = new mongoose.Schema(
  {
    players: { type: [String], required: true },
    state: { type: Object, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("GameSession", GameSessionSchema);
