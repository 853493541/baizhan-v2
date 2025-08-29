import mongoose, { Schema, Document } from "mongoose";

export interface ICharacter extends Document {
  characterId: string;
  account: string;
  server: string;
  gender: string;
  class: string; // 职业
  abilities: { [key: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema: Schema = new Schema(
  {
    characterId: { type: String, required: true },
    account: { type: String, required: true },
    server: { type: String, required: true },
    gender: { type: String, required: true },
    class: { type: String, required: true },
    abilities: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<ICharacter>("Character", CharacterSchema);
