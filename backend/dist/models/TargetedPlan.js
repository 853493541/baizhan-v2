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
/* ---------------------------------------------------------------------------
   📜 Schemas
--------------------------------------------------------------------------- */
// --- DropEntry (new)
const DropEntrySchema = new mongoose_1.Schema({
    characterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Character" },
    ability: { type: String },
    level: { type: Number },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });
// --- Kill (legacy)
const KillSchema = new mongoose_1.Schema({
    floor: { type: Number },
    boss: { type: String },
    completed: { type: Boolean, default: false },
    selection: {
        ability: { type: String },
        level: { type: Number },
        characterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Character" },
        noDrop: { type: Boolean },
        status: {
            type: String,
            enum: ["assigned", "pending", "used", "saved"],
            default: "assigned",
        },
    },
    recordedAt: { type: Date, default: Date.now },
}, { _id: false });
// --- GroupCharacter
const GroupCharacterSchema = new mongoose_1.Schema({
    characterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Character", required: true },
    abilities: {
        type: [{ name: String, level: { type: Number, default: 0 } }],
        default: [],
    },
}, { _id: false });
// --- Group
const GroupSchema = new mongoose_1.Schema({
    index: { type: Number, required: true },
    characters: { type: [GroupCharacterSchema], default: [] },
    status: {
        type: String,
        enum: ["not_started", "started", "finished"],
        default: "not_started",
    },
    kills: { type: [KillSchema], default: [] }, // legacy support
    drops: { type: [DropEntrySchema], default: [] }, // ✅ always defined
    lastResetAt: { type: Date }, // ✅ added
}, { _id: false });
// --- TargetedPlan
const TargetedPlanSchema = new mongoose_1.Schema({
    type: { type: String, default: "targeted" },
    planId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "未命名单体计划" },
    server: { type: String, required: true },
    targetedBoss: { type: String, required: true },
    characterCount: { type: Number, default: 0 },
    characters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Character" }],
    groups: { type: [GroupSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    lastResetAt: { type: Date }, // ✅ new
});
/* ---------------------------------------------------------------------------
   🚀 Export
--------------------------------------------------------------------------- */
exports.default = mongoose_1.default.model("TargetedPlan", TargetedPlanSchema);
