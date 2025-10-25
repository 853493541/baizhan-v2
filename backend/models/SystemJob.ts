import mongoose from "mongoose";

const SystemJobSchema = new mongoose.Schema({
  jobName: { type: String, required: true, unique: true }, // e.g. "weekly-targeted-reset"
  lastRunAt: { type: Date, default: null }, // when it last executed
});

export default mongoose.model("SystemJob", SystemJobSchema);
