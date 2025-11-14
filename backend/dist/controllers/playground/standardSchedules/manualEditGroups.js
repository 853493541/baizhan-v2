"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualEditGroups = void 0;
const StandardSchedule_1 = __importDefault(require("../../../models/StandardSchedule"));
const manualEditGroups = async (req, res) => {
    try {
        const { id } = req.params;
        const { groups: incoming } = req.body;
        if (!Array.isArray(incoming)) {
            return res.status(400).json({ error: "groups must be an array" });
        }
        // Load schedule
        const schedule = await StandardSchedule_1.default.findById(id);
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        // Map index → characters[]
        const map = new Map(incoming.map((g) => [g.index, g.characters || []]));
        // Update characters ONLY
        schedule.groups = schedule.groups.map((old) => {
            const newChars = map.get(old.index);
            if (!newChars)
                return old; // unchanged if frontend didn't include it
            return { ...old, characters: newChars };
        });
        await schedule.save();
        // repopulate to return full objects
        const updated = await StandardSchedule_1.default.findById(id)
            .populate("characters")
            .populate("groups.characters");
        res.json({ success: true, schedule: updated });
    }
    catch (err) {
        console.error("❌ manualEditGroups error:", err);
        res.status(500).json({ error: "Failed to manually edit groups" });
    }
};
exports.manualEditGroups = manualEditGroups;
