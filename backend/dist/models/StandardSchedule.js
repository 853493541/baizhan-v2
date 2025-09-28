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
const AbilitySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    level: { type: Number, required: true },
    available: { type: Boolean, required: true },
}, { _id: false });
const KillSchema = new mongoose_1.Schema({
    floor: { type: Number, required: true },
    boss: { type: String },
    completed: { type: Boolean, default: false },
    selection: {
        ability: { type: String },
        level: { type: Number },
        characterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Character" },
        noDrop: { type: Boolean },
    },
    recordedAt: { type: Date, default: Date.now },
}, { _id: false });
const GroupSchema = new mongoose_1.Schema({
    index: { type: Number, required: true },
    characters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Character" }],
    status: {
        type: String,
        enum: ["not_started", "started", "finished"],
        default: "not_started",
    },
    kills: { type: [KillSchema], default: [] },
}, { _id: false });
const StandardScheduleSchema = new mongoose_1.Schema({
    name: { type: String, default: "未命名排表" },
    server: { type: String, required: true },
    conflictLevel: { type: Number, enum: [9, 10], required: true },
    createdAt: { type: Date, default: Date.now },
    checkedAbilities: [AbilitySchema],
    characterCount: { type: Number, default: 0 },
    characters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Character" }],
    groups: [GroupSchema],
});
exports.default = mongoose_1.default.model("StandardSchedule", StandardScheduleSchema);
