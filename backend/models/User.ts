import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  tokenVersion: number;

  lastSeenAt?: Date;
  lastSeenIp?: string;

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

    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
    },

    // 👀 Presence
    lastSeenAt: {
      type: Date,
      default: null,
    },

    // 🌐 Last known IP (overwritten, not audit)
    lastSeenIp: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Normalize username
UserSchema.pre("save", function (next) {
  if (this.isModified("username")) {
    this.username = this.username.trim().toLowerCase();
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
