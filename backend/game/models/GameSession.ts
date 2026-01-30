// backend/game/models/GameSession.ts
import mongoose from "mongoose";

const GameSessionSchema = new mongoose.Schema(
  {
    players: { type: [String], required: true },
    state: { type: Object, required: true },

    // ✅ ADD THESE (nothing else)
    started: { type: Boolean, default: false },
    turn: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("GameSession", GameSessionSchema);
