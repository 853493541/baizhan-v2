"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BossPlanSchema = new mongoose_1.default.Schema({
    server: { type: String, required: true, default: "乾坤一掷" }, // which server this plan is for
    groupSize: { type: Number, enum: [2, 3], required: true }, // group size (2 or 3)
    boss: { type: String, required: true }, // boss name
    createdAt: { type: Date, default: Date.now }, // auto timestamp
});
exports.default = mongoose_1.default.model("BossPlan", BossPlanSchema);
