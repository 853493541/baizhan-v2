import mongoose, { Schema, Document } from "mongoose";

interface CheckedAbility {
  name: string;
  level: number;
  available: boolean;
}

interface KillSelection {
  ability?: string;
  level?: number;
  characterId?: mongoose.Types.ObjectId;
  noDrop?: boolean;
  status?: "assigned" | "pending" | "used" | "saved"; // ✅ new
}

interface Kill {
  floor: number;
  boss: string;
  completed: boolean;
  selection?: KillSelection;
  recordedAt: Date;
}

interface Group {
  index: number;
  characters: mongoose.Types.ObjectId[];
  status: "not_started" | "started" | "finished";
  kills: Kill[];

  // ⭐ NEW — lifecycle timestamps
  startTime?: Date;
  endTime?: Date;
}

export interface IStandardSchedule extends Document {
  name: string;
  server: string;
  conflictLevel?: number;
  createdAt: Date;
  checkedAbilities: CheckedAbility[];
  characterCount: number;
  characters: mongoose.Types.ObjectId[];
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

const KillSchema = new Schema<Kill>(
  {
    floor: { type: Number, required: true },
    boss: { type: String },
    completed: { type: Boolean, default: false },
    selection: {
      ability: { type: String },
      level: { type: Number },
      characterId: { type: Schema.Types.ObjectId, ref: "Character" },
      noDrop: { type: Boolean },
      status: {
        type: String,
        enum: ["assigned", "pending", "used", "saved"],
        default: "assigned",
      }, // ✅ new field
    },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<Group>(
  {
    index: { type: Number, required: true },
    characters: [{ type: Schema.Types.ObjectId, ref: "Character" }],
    status: {
      type: String,
      enum: ["not_started", "started", "finished"],
      default: "not_started",
    },
    kills: { type: [KillSchema], default: [] },

    // ⭐ NEW — lifecycle timestamps
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { _id: false }
);

const StandardScheduleSchema = new Schema<IStandardSchedule>({
  name: { type: String, default: "未命名排表" },
  server: { type: String, required: true },
  conflictLevel: { type: Number, enum: [9, 10] },
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
