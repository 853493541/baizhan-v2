"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromStorage = exports.useStoredAbility = exports.getStorage = exports.addToStorage = exports.deleteCharacter = exports.updateCharacter = exports.updateCharacterAbilities = void 0;
const Character_1 = __importDefault(require("../../models/Character"));
const AbilityHistory_1 = __importDefault(require("../../models/AbilityHistory"));
// =====================================================
// ✅ Ability Management (existing functionality)
// =====================================================
// ✅ Update abilities + record every change
const updateCharacterAbilities = async (req, res) => {
    try {
        const { abilities } = req.body;
        if (!abilities || typeof abilities !== "object") {
            return res.status(400).json({ error: "abilities object is required" });
        }
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        const setOps = {};
        const updated = [];
        const historyEntries = [];
        for (const [name, level] of Object.entries(abilities)) {
            const newVal = Number(level);
            const oldVal = char.abilities?.get?.(name) ??
                char.abilities?.[name] ??
                0;
            setOps[`abilities.${name}`] = newVal;
            updated.push({ name, old: Number(oldVal), new: newVal });
            // ✅ only log if changed
            if (newVal !== oldVal) {
                historyEntries.push({
                    characterId: char._id,
                    characterName: char.name,
                    abilityName: name,
                    beforeLevel: oldVal,
                    afterLevel: newVal,
                });
            }
        }
        if (Object.keys(setOps).length === 0) {
            return res.status(400).json({ error: "No abilities provided" });
        }
        // ✅ perform ability update
        const newDoc = await Character_1.default.findByIdAndUpdate(req.params.id, { $set: setOps }, { new: true });
        // ✅ insert history logs (if any)
        if (historyEntries.length > 0) {
            await AbilityHistory_1.default.insertMany(historyEntries);
            console.log(`[AbilityHistory] Logged ${historyEntries.length} ability changes for ${char.name}`);
        }
        return res.json({ character: newDoc, updated });
    }
    catch (err) {
        console.error("❌ updateCharacterAbilities error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.updateCharacterAbilities = updateCharacterAbilities;
// =====================================================
// ✅ Character Basic Info Management (unchanged)
// =====================================================
const updateCharacter = async (req, res) => {
    try {
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        const { account, server, gender, class: charClass, role, active, name } = req.body;
        if (name !== undefined)
            char.name = String(name).trim();
        if (account !== undefined)
            char.account = String(account).trim();
        if (server !== undefined)
            char.server = server;
        if (gender !== undefined)
            char.gender = gender;
        if (role !== undefined)
            char.role = role;
        if (charClass !== undefined)
            char.class = String(charClass).trim();
        if (active !== undefined)
            char.active = Boolean(active);
        await char.save();
        res.json(char);
    }
    catch (err) {
        if (err?.name === "ValidationError") {
            return res
                .status(400)
                .json({ error: "ValidationError", details: err.errors });
        }
        return res.status(500).json({ error: err.message });
    }
};
exports.updateCharacter = updateCharacter;
const deleteCharacter = async (req, res) => {
    try {
        const deleted = await Character_1.default.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ error: "Character not found" });
        res.json({ message: "Character deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteCharacter = deleteCharacter;
// =====================================================
// ✅ Storage System (存入仓库 / 从仓库使用)
// =====================================================
// ➕ Add a drop to storage
const addToStorage = async (req, res) => {
    try {
        const { ability, level, sourceBoss } = req.body;
        if (!ability || !level) {
            return res.status(400).json({ error: "ability and level are required" });
        }
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        char.storage.push({
            ability,
            level,
            sourceBoss,
            receivedAt: new Date(),
            used: false,
        });
        await char.save();
        console.log(`[Storage] Added ${ability}${level}重 to ${char.name}'s storage.`);
        return res.json({ message: "Stored successfully", storage: char.storage });
    }
    catch (err) {
        console.error("❌ addToStorage error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.addToStorage = addToStorage;
// 🧾 Get stored abilities list
const getStorage = async (req, res) => {
    try {
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        return res.json(char.storage || []);
    }
    catch (err) {
        console.error("❌ getStorage error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.getStorage = getStorage;
// ⚙️ Use stored ability (apply to abilities + mark as used)
const useStoredAbility = async (req, res) => {
    try {
        const { ability, level } = req.body;
        if (!ability || !level) {
            return res.status(400).json({ error: "ability and level are required" });
        }
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        // 1️⃣ Upgrade the ability level
        const oldLevel = char.abilities?.get?.(ability) ??
            char.abilities?.[ability] ??
            0;
        char.abilities.set
            ? char.abilities.set(ability, level)
            : (char.abilities[ability] = level);
        // 2️⃣ Remove the used item from storage
        const before = char.storage.length;
        char.storage = char.storage.filter((item) => !(item.ability === ability && item.level === level));
        const removed = before - char.storage.length;
        // 3️⃣ Save the character
        await char.save();
        // 4️⃣ Log to ability history
        await AbilityHistory_1.default.create({
            characterId: char._id,
            characterName: char.name,
            abilityName: ability,
            beforeLevel: oldLevel,
            afterLevel: level,
        });
        console.log(`[Storage] ${char.name} used ${ability}${level}重 from storage (removed ${removed})`);
        return res.json({
            message: "Stored ability consumed successfully",
            removed,
            newLevel: level,
        });
    }
    catch (err) {
        console.error("❌ useStoredAbility error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.useStoredAbility = useStoredAbility;
const deleteFromStorage = async (req, res) => {
    try {
        const { id } = req.params;
        const { ability, level } = req.body;
        if (!ability || !level)
            return res.status(400).json({ error: "缺少参数 ability 或 level" });
        const char = await Character_1.default.findById(id);
        if (!char)
            return res.status(404).json({ error: "角色不存在" });
        char.storage = (char.storage || []).filter((item) => !(item.ability === ability && item.level === level));
        await char.save();
        res.json({ success: true, message: `已删除 ${ability}${level}重` });
    }
    catch (err) {
        console.error("❌ deleteFromStorage error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.deleteFromStorage = deleteFromStorage;
