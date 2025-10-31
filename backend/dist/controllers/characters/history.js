"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestAbilityUpdate = exports.revertMultipleHistory = exports.deleteAbilityHistory = exports.revertAbilityHistory = exports.getAbilityHistory = void 0;
const Character_1 = __importDefault(require("../../models/Character"));
const AbilityHistory_1 = __importDefault(require("../../models/AbilityHistory"));
/**
 * =====================================================
 * ✅ Ability History Controllers
 * =====================================================
 */
/**
 * 🔹 Get ability update history (with optional filters)
 */
const getAbilityHistory = async (req, res) => {
    try {
        const { name, ability, limit } = req.query;
        const filter = {};
        if (name)
            filter.characterName = name;
        if (ability)
            filter.abilityName = ability;
        const limitNum = Number(limit) || 200;
        const history = await AbilityHistory_1.default.find(filter)
            .sort({ updatedAt: -1 })
            .limit(limitNum)
            .lean();
        return res.json(history);
    }
    catch (err) {
        console.error("❌ getAbilityHistory error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.getAbilityHistory = getAbilityHistory;
/**
 * 🔹 Revert a single ability record
 */
const revertAbilityHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await AbilityHistory_1.default.findById(id);
        if (!history)
            return res
                .status(404)
                .json({ error: "History record not found or already deleted" });
        const char = await Character_1.default.findById(history.characterId);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        const abilityName = history.abilityName;
        const revertLevel = history.beforeLevel;
        await Character_1.default.findByIdAndUpdate(char._id, {
            $set: { [`abilities.${abilityName}`]: revertLevel },
        });
        await AbilityHistory_1.default.findByIdAndDelete(id);
        console.log(`[AbilityHistory] Silently reverted ${char.name} - ${abilityName} to ${revertLevel}重 (record ${id} deleted)`);
        return res.json({
            message: "Ability reverted successfully (no new history logged)",
            revertedTo: revertLevel,
        });
    }
    catch (err) {
        console.error("❌ revertAbilityHistory error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.revertAbilityHistory = revertAbilityHistory;
/**
 * 🔹 Delete a single history record
 */
const deleteAbilityHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await AbilityHistory_1.default.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ error: "History record not found" });
        console.log(`[AbilityHistory] Deleted history record ${id}`);
        return res.json({ message: "History record deleted" });
    }
    catch (err) {
        console.error("❌ deleteAbilityHistory error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.deleteAbilityHistory = deleteAbilityHistory;
/**
 * 🔹 Batch revert multiple ability history records at once
 *    - Faster and atomic compared to individual requests
 */
const revertMultipleHistory = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "ids[] is required" });
        }
        // 1️⃣ Fetch all requested history records
        const histories = await AbilityHistory_1.default.find({ _id: { $in: ids } });
        if (histories.length === 0) {
            return res.status(404).json({ error: "No history records found" });
        }
        // 2️⃣ Group history entries by character ID
        const grouped = new Map();
        for (const h of histories) {
            if (!h.characterId)
                continue; // ✅ skip null/undefined
            const charId = h.characterId.toString();
            const list = grouped.get(charId) || [];
            list.push(h);
            grouped.set(charId, list);
        }
        // 3️⃣ For each character, build bulk update
        for (const [charId, records] of grouped.entries()) {
            const setOps = {};
            for (const r of records) {
                setOps[`abilities.${r.abilityName}`] = r.beforeLevel;
            }
            await Character_1.default.findByIdAndUpdate(charId, { $set: setOps });
        }
        // 4️⃣ Delete all reverted history entries
        await AbilityHistory_1.default.deleteMany({ _id: { $in: ids } });
        console.log(`[AbilityHistory] Batch reverted ${ids.length} records across ${grouped.size} characters.`);
        return res.json({
            success: true,
            revertedCount: ids.length,
            affectedCharacters: grouped.size,
        });
    }
    catch (err) {
        console.error("❌ revertMultipleHistory error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.revertMultipleHistory = revertMultipleHistory;
/**
 * 🔹 Get latest ability update for a specific character
 *    - Returns last updated ability name + time
 */
const getLatestAbilityUpdate = async (req, res) => {
    try {
        const { characterId } = req.params;
        if (!characterId) {
            return res.status(400).json({ error: "characterId is required" });
        }
        const latest = await AbilityHistory_1.default.findOne({ characterId })
            .sort({ updatedAt: -1 })
            .select("abilityName afterLevel updatedAt")
            .lean();
        if (!latest) {
            return res.json({ message: "No update history found" });
        }
        return res.json({
            abilityName: latest.abilityName,
            level: latest.afterLevel,
            updatedAt: latest.updatedAt,
        });
    }
    catch (err) {
        console.error("❌ getLatestAbilityUpdate error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.getLatestAbilityUpdate = getLatestAbilityUpdate;
