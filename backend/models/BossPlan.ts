import mongoose from "mongoose";

const BossPlanSchema = new mongoose.Schema({
  server: { type: String, required: true, default: "乾坤一掷" }, // which server this plan is for
  groupSize: { type: Number, enum: [2, 3], required: true },    // group size (2 or 3)
  boss: { type: String, required: true },                      // boss name
  createdAt: { type: Date, default: Date.now },                // auto timestamp
});

export default mongoose.model("BossPlan", BossPlanSchema);
