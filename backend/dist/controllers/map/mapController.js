"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeeklyMap = exports.saveWeeklyMap = void 0;
const WeeklyMap_1 = __importDefault(require("../../models/WeeklyMap"));
const weekUtils_1 = require("../../utils/weekUtils");
// Save or update this week's map
const saveWeeklyMap = async (req, res) => {
    try {
        const week = (0, weekUtils_1.getCurrentWeek)();
        const { floors } = req.body;
        if (!floors) {
            return res.status(400).json({ error: "floors are required" });
        }
        const updated = await WeeklyMap_1.default.findOneAndUpdate({ week }, { floors }, { new: true, upsert: true });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.saveWeeklyMap = saveWeeklyMap;
// Get this week's map
const getWeeklyMap = async (_req, res) => {
    try {
        const week = (0, weekUtils_1.getCurrentWeek)();
        const map = await WeeklyMap_1.default.findOne({ week });
        if (!map)
            return res.status(404).json({ error: "No map for this week" });
        res.json(map);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getWeeklyMap = getWeeklyMap;
