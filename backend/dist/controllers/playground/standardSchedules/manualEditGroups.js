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
        // Build a map of old groups by index for preserving kills/status
        const oldMap = new Map();
        for (const g of schedule.groups) {
            oldMap.set(g.index, g);
        }
        // Build the new groups array exactly as frontend desires
        const rebuilt = incoming.map((g) => {
            const prev = oldMap.get(g.index);
            return {
                index: g.index,
                characters: g.characters || [],
                kills: prev?.kills || [],
                status: prev?.status || "not_started",
            };
        });
        // Replace groups entirely
        schedule.groups = rebuilt;
        await schedule.save();
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
