"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
// 🔹 Storage sub-schema
const StoredAbilitySchema = new mongoose_1.Schema({
    ability: { type: String, required: true },
    level: { type: Number, required: true },
    sourceBoss: { type: String },
    receivedAt: { type: Date, default: Date.now },
    used: { type: Boolean, default: false },
}, { _id: false });
const CharacterSchema = new mongoose_1.Schema({
    characterId: {
        type: String,
        unique: true,
        default: uuid_1.v4,
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
    owner: { type: String, default: "Unknown", trim: true },
    storage: { type: [StoredAbilitySchema], default: [] }, // ✅ added
});
exports.default = mongoose_1.default.model("Character", CharacterSchema);
