"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleScheduleCharacter = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const StandardSchedule_1 = __importDefault(require("../../../models/StandardSchedule"));
/**
 * PATCH /api/standard-schedules/:id/toggle-character
 * Body:
 *   { characterId: string, add: boolean }
 *
 * Adds or removes a character from schedule.characters
 */
const toggleScheduleCharacter = async (req, res) => {
    try {
        const { id } = req.params;
        const { characterId, add } = req.body;
        if (!characterId) {
            return res.status(400).json({ error: "characterId is required" });
        }
        // Validate ObjectId
        if (!mongoose_1.default.isValidObjectId(characterId)) {
            return res.status(400).json({ error: "Invalid characterId" });
        }
        const schedule = await StandardSchedule_1.default.findById(id);
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        // Convert to Set of string IDs
        const idSet = new Set((schedule.characters || []).map((c) => String(c)));
        if (add) {
            idSet.add(String(characterId));
        }
        else {
            idSet.delete(String(characterId));
        }
        // Convert back to ObjectId[]
        schedule.characters = Array.from(idSet).map((cid) => new mongoose_1.default.Types.ObjectId(cid));
        // ⭐ IMPORTANT: update characterCount
        schedule.characterCount = schedule.characters.length;
        await schedule.save();
        return res.json({
            success: true,
            characterCount: schedule.characterCount,
            characters: schedule.characters,
        });
    }
    catch (err) {
        console.error("❌ toggleScheduleCharacter error:", err);
        return res.status(500).json({ error: "Failed to toggle character" });
    }
};
exports.toggleScheduleCharacter = toggleScheduleCharacter;
