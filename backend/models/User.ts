import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;          // stored normalized (lowercase)
  passwordHash: string;      // bcrypt hash
  tokenVersion: number;      // 🔐 used to invalidate all existing tokens
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // 🔑 IMPORTANT: token version for global logout
    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// Always store username as lowercase + trimmed
UserSchema.pre("save", function (next) {
  if (this.isModified("username")) {
    this.username = this.username.trim().toLowerCase();
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
