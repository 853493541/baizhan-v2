"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(MONGO_URI, {
            dbName: "baizhan_V2", // 👈 force database
        });
        console.log("Connected DB name:", mongoose_1.default.connection.db?.databaseName);
        console.log("✅ MongoDB connected to baizhan_V2");
    }
    catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
