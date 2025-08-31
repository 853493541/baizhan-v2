import mongoose, { Schema, Document } from "mongoose";

export interface Character extends Document {
  name: string;
  account: string;
  server: "梦江南" | "乾坤一掷" | "唯我独尊";
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  abilities: Record<string, number>;
}

const CharacterSchema: Schema = new Schema({
  name: { type: String, required: true },
  account: { type: String, required: true },
  server: { type: String, enum: ["梦江南", "乾坤一掷", "唯我独尊"], required: true },
  gender: { type: String, enum: ["男", "女"], required: true },
  class: { type: String, required: true },
  role: { type: String, enum: ["DPS", "Tank", "Healer"], required: true },
  active: { type: Boolean, default: true },
  abilities: { type: Map, of: Number, default: {} }
});

export default mongoose.model<Character>("Character", CharacterSchema);
