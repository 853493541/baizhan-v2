"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeeklyMapStats = exports.lockWeeklyMap = exports.getWeeklyMapHistory = exports.getPastWeeklyMap = exports.deleteWeeklyMap = exports.getWeeklyMap = exports.saveWeeklyMap = void 0;
const WeeklyMap_1 = __importDefault(require("../../models/WeeklyMap"));
const weekUtils_1 = require("../../utils/weekUtils"); // ✅ updated import name
// Save or update this week's map
const saveWeeklyMap = async (req, res) => {
    try {
        const week = (0, weekUtils_1.getCurrentGameWeek)(); // ✅ updated
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
        const week = (0, weekUtils_1.getCurrentGameWeek)(); // ✅ updated
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
// ✅ Delete current week's map
const deleteWeeklyMap = async (_req, res) => {
    try {
        const week = (0, weekUtils_1.getCurrentGameWeek)(); // ✅ updated
        const result = await WeeklyMap_1.default.deleteOne({ week });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "No map found for this week" });
        }
        res.json({ message: `Weekly map for ${week} deleted` });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteWeeklyMap = deleteWeeklyMap;
// ✅ Fetch a specific past week (?week=2025-W38)
const getPastWeeklyMap = async (req, res) => {
    try {
        const { week } = req.query;
        if (!week) {
            return res
                .status(400)
                .json({ error: "week query param is required (e.g. ?week=2025-W38)" });
        }
        const map = await WeeklyMap_1.default.findOne({ week });
        if (!map)
            return res.status(404).json({ error: `No map found for week ${week}` });
        res.json(map);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getPastWeeklyMap = getPastWeeklyMap;
// Get all past weeks (history, newest → oldest)
const getWeeklyMapHistory = async (_req, res) => {
    try {
        const currentWeek = (0, weekUtils_1.getCurrentGameWeek)(); // ✅ updated
        const maps = await WeeklyMap_1.default.find({ week: { $ne: currentWeek } })
            .sort({ week: -1 })
            .limit(5);
        res.json(maps);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getWeeklyMapHistory = getWeeklyMapHistory;
const lockWeeklyMap = async (_req, res) => {
    try {
        const week = (0, weekUtils_1.getCurrentGameWeek)(); // ✅ updated
        const updated = await WeeklyMap_1.default.findOneAndUpdate({ week }, { locked: true }, { new: true });
        if (!updated) {
            return res.status(404).json({ error: "No map for this week" });
        }
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.lockWeeklyMap = lockWeeklyMap;
// ⬇️ NEW CONTROLLER
const getWeeklyMapStats = async (_req, res) => {
    try {
        const allWeeks = await WeeklyMap_1.default.find().lean();
        const currentWeek = (0, weekUtils_1.getCurrentGameWeek)(); // "2025-W16"
        const [currentYear, currentW] = currentWeek.split("-W").map(Number);
        const currentWeekNumber = currentYear * 52 + currentW;
        const floor90 = {};
        const floor100 = {};
        for (const week of allWeeks) {
            const [year, w] = week.week.split("-W").map(Number);
            const weekNumber = year * 52 + w;
            const f90 = week.floors?.["90"]?.boss;
            const f100 = week.floors?.["100"]?.boss;
            if (f90) {
                if (!floor90[f90]) {
                    floor90[f90] = {
                        count: 0,
                        weeks: [],
                        lastWeek: null,
                        weeksAgo: null,
                        _weekNumbers: []
                    };
                }
                floor90[f90].count++;
                floor90[f90].weeks.push(week.week);
                floor90[f90]._weekNumbers.push(weekNumber);
                if (!floor90[f90].lastWeek || weekNumber > floor90[f90]._lastWeekNumber) {
                    floor90[f90].lastWeek = week.week;
                    floor90[f90]._lastWeekNumber = weekNumber;
                }
            }
            if (f100) {
                if (!floor100[f100]) {
                    floor100[f100] = {
                        count: 0,
                        weeks: [],
                        lastWeek: null,
                        weeksAgo: null,
                        _weekNumbers: []
                    };
                }
                floor100[f100].count++;
                floor100[f100].weeks.push(week.week);
                floor100[f100]._weekNumbers.push(weekNumber);
                if (!floor100[f100].lastWeek || weekNumber > floor100[f100]._lastWeekNumber) {
                    floor100[f100].lastWeek = week.week;
                    floor100[f100]._lastWeekNumber = weekNumber;
                }
            }
        }
        // Compute weeksAgo and clean internal data
        for (const boss in floor90) {
            floor90[boss].weeksAgo =
                currentWeekNumber - floor90[boss]._lastWeekNumber;
            floor90[boss].weeks.sort(); // chronological ascending
            delete floor90[boss]._lastWeekNumber;
            delete floor90[boss]._weekNumbers;
        }
        for (const boss in floor100) {
            floor100[boss].weeksAgo =
                currentWeekNumber - floor100[boss]._lastWeekNumber;
            floor100[boss].weeks.sort();
            delete floor100[boss]._lastWeekNumber;
            delete floor100[boss]._weekNumbers;
        }
        res.json({ floor90, floor100 });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getWeeklyMapStats = getWeeklyMapStats;
