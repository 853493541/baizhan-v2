import mongoose, { Schema, Document } from "mongoose";

interface CheckedAbility {
  name: string;
  level: number;
  available: boolean;
}

interface Group {
  index: number; // group number
  characters: mongoose.Types.ObjectId[]; // refs to Character
}

export interface IStandardSchedule extends Document {
  name: string; // ✅ custom schedule name
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: Date;
  checkedAbilities: CheckedAbility[];
  characterCount: number;
  characters: mongoose.Types.ObjectId[]; // reference to Character
  groups: Group[];
}

const AbilitySchema = new Schema<CheckedAbility>(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true },
    available: { type: Boolean, required: true },
  },
  { _id: false }
);

const GroupSchema = new Schema<Group>(
  {
    index: { type: Number, required: true },
    characters: [{ type: Schema.Types.ObjectId, ref: "Character" }],
  },
  { _id: false }
);

const StandardScheduleSchema = new Schema<IStandardSchedule>({
  name: { type: String, default: "未命名排表" }, // ✅ new field with default
  server: { type: String, required: true },
  mode: { type: String, enum: ["default", "custom"], required: true },
  conflictLevel: { type: Number, enum: [9, 10], required: true },
  createdAt: { type: Date, default: Date.now },
  checkedAbilities: [AbilitySchema],
  characterCount: { type: Number, default: 0 },
  characters: [{ type: Schema.Types.ObjectId, ref: "Character" }],
  groups: [GroupSchema],
});

export default mongoose.model<IStandardSchedule>(
  "StandardSchedule",
  StandardScheduleSchema
);
