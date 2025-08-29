import mongoose, { Schema, Document } from "mongoose";

export interface IAbility extends Document {
  name: string;
  color?: string;
  boss?: string;
  description?: string;
}

const AbilitySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String },
  boss: { type: String },
  description: { type: String },
});

export default mongoose.model<IAbility>("Ability", AbilitySchema);
