import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface Character extends Document {
  characterId: string; // 👈 internal unique ID
  name: string;
  account: string;
  server: "梦江南" | "乾坤一掷" | "唯我独尊"; // kept for now
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  abilities: Record<string, number>;
  owner: string;
  catalog: string[];       // 🔹 NEW
  mainCharacter: boolean;  // 🔹 NEW
}

const CharacterSchema: Schema = new Schema(
  {
    characterId: {
      type: String,
      unique: true,
      default: uuidv4, // 👈 auto-generate a UUID
    },
    name: { type: String, required: true, trim: true },
    account: { type: String, required: true, trim: true },
    server: {
      type: String,
      enum: ["梦江南", "乾坤一掷", "唯我独尊"],
      default: "", // ✅ safe default (so not required anymore)
    },
    gender: { type: String, enum: ["男", "女"], required: true },
    class: { type: String, required: true, trim: true },
    role: { type: String, enum: ["DPS", "Tank", "Healer"], required: true },
    active: { type: Boolean, default: true },
    abilities: { type: Map, of: Number, default: {} },
    owner: { type: String, default: "Unknown", trim: true },

    // 🔹 NEW fields
    catalog: { type: [String], default: [] }, // multiple categories
    mainCharacter: { type: Boolean, default: false }, // mark important
  },
  { timestamps: true }
);

export default mongoose.model<Character>("Character", CharacterSchema);
