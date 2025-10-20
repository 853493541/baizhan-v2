import mongoose, { Schema, Document } from "mongoose";

interface KillSelection {
  ability?: string;
  level?: number;
  characterId?: mongoose.Types.ObjectId;
  noDrop?: boolean;
  status?: "assigned" | "pending" | "used" | "saved";
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
}

export interface ITargetedPlan extends Document {
  type: "targeted";
  planId: string;
  name: string;
  server: string;
  targetedBoss: string; // 🆕 the focused boss or enemy
  createdAt: Date;
  characterCount: number;
  characters: mongoose.Types.ObjectId[];
  groups: Group[];
}

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
      },
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
  },
  { _id: false }
);

const TargetedPlanSchema = new Schema<ITargetedPlan>({
  type: { type: String, default: "targeted" },
  planId: { type: String, required: true, unique: true },
  name: { type: String, default: "未命名单体计划" },
  server: { type: String, required: true },
  targetedBoss: { type: String, required: true }, // 🆕 added
  characterCount: { type: Number, default: 0 },
  characters: [{ type: Schema.Types.ObjectId, ref: "Character" }],
  groups: [GroupSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITargetedPlan>(
  "TargetedPlan",
  TargetedPlanSchema
);
