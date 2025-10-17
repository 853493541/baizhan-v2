import mongoose from "mongoose";

const AbilityHistorySchema = new mongoose.Schema({
  characterId: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
  characterName: { type: String, required: true },
  abilityName: { type: String, required: true },
  beforeLevel: { type: Number, required: true },
  afterLevel: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("AbilityHistory", AbilityHistorySchema);
