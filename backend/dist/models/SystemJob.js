"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const SystemJobSchema = new mongoose_1.default.Schema({
    jobName: { type: String, required: true, unique: true }, // e.g. "weekly-targeted-reset"
    lastRunAt: { type: Date, default: null }, // when it last executed
});
exports.default = mongoose_1.default.model("SystemJob", SystemJobSchema);
