import mongoose, { Schema, Document } from "mongoose";

export interface IFloorAssignment {
  boss: string;
}

export interface IWeeklyMap extends Document {
  week: string; // e.g. "2025-W37"
  floors: Record<number, IFloorAssignment>; // 81–100 mapping
}

const WeeklyMapSchema = new Schema<IWeeklyMap>({
  week: { type: String, required: true, unique: true },
  floors: { type: Map, of: { boss: String }, required: true },
});

export default mongoose.model<IWeeklyMap>("WeeklyMap", WeeklyMapSchema);
