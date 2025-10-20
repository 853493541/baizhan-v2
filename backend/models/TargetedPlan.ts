import mongoose, { Schema, Document } from "mongoose";

/* ---------------------------------------------------------------------------
   🎯 Sub-schema: Kill Selection
--------------------------------------------------------------------------- */
interface KillSelection {
  ability?: string;
  level?: number;
  characterId?: mongoose.Types.ObjectId;
  noDrop?: boolean;
  status?: "assigned" | "pending" | "used" | "saved";
}

/* ---------------------------------------------------------------------------
   ⚔️ Sub-schema: Kill Entry
--------------------------------------------------------------------------- */
interface Kill {
  floor: number;
  boss: string;
  completed: boolean;
  selection?: KillSelection;
  recordedAt: Date;
}

/* ---------------------------------------------------------------------------
   🧩 Sub-schema: Character Entry within a Group
--------------------------------------------------------------------------- */
interface GroupCharacter {
  characterId: mongoose.Types.ObjectId;
  abilities?: string[]; // ✅ list of abilities assigned to this specific character
}

/* ---------------------------------------------------------------------------
   🧱 Group Schema
--------------------------------------------------------------------------- */
interface Group {
  index: number;
  characters: GroupCharacter[]; // ✅ characters with their abilities
  status: "not_started" | "started" | "finished";
  kills: Kill[];
}

/* ---------------------------------------------------------------------------
   🗂️ Main TargetedPlan Interface
--------------------------------------------------------------------------- */
export interface ITargetedPlan extends Document {
  type: "targeted";
  planId: string;
  name: string;
  server: string;
  targetedBoss: string;
  createdAt: Date;
  characterCount: number;
  characters: mongoose.Types.ObjectId[]; // overall pool of available characters
  groups: Group[];
}

/* ---------------------------------------------------------------------------
   📜 Schemas
--------------------------------------------------------------------------- */

// --- Kill ---
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

// --- GroupCharacter ---
const GroupCharacterSchema = new Schema<GroupCharacter>(
  {
    characterId: { type: Schema.Types.ObjectId, ref: "Character", required: true },
    abilities: { type: [String], default: [] }, // ✅ can hold up to 3 abilities
  },
  { _id: false }
);

// --- Group ---
const GroupSchema = new Schema<Group>(
  {
    index: { type: Number, required: true },
    characters: { type: [GroupCharacterSchema], default: [] },
    status: {
      type: String,
      enum: ["not_started", "started", "finished"],
      default: "not_started",
    },
    kills: { type: [KillSchema], default: [] },
  },
  { _id: false }
);

// --- Main TargetedPlan ---
const TargetedPlanSchema = new Schema<ITargetedPlan>({
  type: { type: String, default: "targeted" },
  planId: { type: String, required: true, unique: true },
  name: { type: String, default: "未命名单体计划" },
  server: { type: String, required: true },
  targetedBoss: { type: String, required: true },
  characterCount: { type: Number, default: 0 },
  characters: [{ type: Schema.Types.ObjectId, ref: "Character" }],
  groups: { type: [GroupSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

/* ---------------------------------------------------------------------------
   🚀 Export
--------------------------------------------------------------------------- */
export default mongoose.model<ITargetedPlan>("TargetedPlan", TargetedPlanSchema);
