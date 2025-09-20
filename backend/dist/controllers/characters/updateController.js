"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCharacter = exports.updateCharacter = exports.updateCharacterAbilities = void 0;
const Character_1 = __importDefault(require("../../models/Character"));
const updateCharacterAbilities = async (req, res) => {
    var _a, _b, _c, _d, _e;
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
        for (const [name, level] of Object.entries(abilities)) {
            // always update or create
            const oldVal = (_e = (_c = (_b = (_a = char.abilities) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a, name)) !== null && _c !== void 0 ? _c : (_d = char.abilities) === null || _d === void 0 ? void 0 : _d[name]) !== null && _e !== void 0 ? _e : 0;
            setOps[`abilities.${name}`] = Number(level);
            updated.push({ name, old: Number(oldVal), new: Number(level) });
        }
        if (Object.keys(setOps).length === 0) {
            return res.status(400).json({ error: "No abilities provided" });
        }
        const newDoc = await Character_1.default.findByIdAndUpdate(req.params.id, { $set: setOps }, { new: true });
        return res.json({ character: newDoc, updated });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.updateCharacterAbilities = updateCharacterAbilities;
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
        if ((err === null || err === void 0 ? void 0 : err.name) === "ValidationError") {
            return res.status(400).json({ error: "ValidationError", details: err.errors });
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
