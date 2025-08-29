import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "baizhan_V2",   // 👈 force database
    });

    console.log("Connected DB name:", mongoose.connection.db?.databaseName);
    console.log("✅ MongoDB connected to baizhan_V2");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
