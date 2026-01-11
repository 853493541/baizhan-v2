import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// 🎯 Define storage item structure
interface StoredAbility {
  ability: string;
  level: number;
  sourceBoss?: string;
  receivedAt: Date;
  used: boolean;
}

export interface Character extends Document {
  characterId: string;
  name: string;
  account: string;
  server: "梦江南" | "乾坤一掷" | "唯我独尊";
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  abilities: Record<string, number>;
    energy: number;
  durability: number;
  owner: string;
  storage: StoredAbility[]; // 🔹 new storage field
}

// 🔹 Storage sub-schema
const StoredAbilitySchema = new Schema<StoredAbility>(
  {
    ability: { type: String, required: true },
    level: { type: Number, required: true },
    sourceBoss: { type: String },
    receivedAt: { type: Date, default: Date.now },
    used: { type: Boolean, default: false },
  },
  { _id: false }
);

const CharacterSchema: Schema = new Schema({
  characterId: {
    type: String,
    unique: true,
    default: uuidv4,
  },
  name: { type: String, required: true, trim: true },
  account: { type: String, required: true, trim: true },
  server: {
    type: String,
    enum: ["梦江南", "乾坤一掷", "唯我独尊"],
    required: true,
  },
  gender: { type: String, enum: ["男", "女"], required: true },
  class: { type: String, required: true, trim: true },
  role: { type: String, enum: ["DPS", "Tank", "Healer"], required: true },
  active: { type: Boolean, default: true },
  abilities: { type: Map, of: Number, default: {} },

   energy: {
      type: Number,
      default: 10000,
      min: 0,
    },

    durability: {
      type: Number,
      default: 10000,
      min: 0,
    },








  owner: { type: String, default: "Unknown", trim: true },
  storage: { type: [StoredAbilitySchema], default: [] }, // ✅ added
});

export default mongoose.model<Character>("Character", CharacterSchema);
