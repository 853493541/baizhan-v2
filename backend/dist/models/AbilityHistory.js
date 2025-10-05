"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const AbilityHistorySchema = new mongoose_1.default.Schema({
    characterId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Character" },
    characterName: { type: String, required: true },
    abilityName: { type: String, required: true },
    beforeLevel: { type: Number, required: true },
    afterLevel: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
});
exports.default = mongoose_1.default.model("AbilityHistory", AbilityHistorySchema);
