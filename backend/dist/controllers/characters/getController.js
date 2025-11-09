"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAccounts = exports.getAllStorage = exports.getCharacterById = exports.getCharacters = void 0;
const Character_1 = __importDefault(require("../../models/Character"));
const getCharacters = async (req, res) => {
    try {
        const { owner, server, active } = req.query; // 🔹 optional filters
        const filter = {};
        if (owner)
            filter.owner = String(owner).trim();
        if (server)
            filter.server = String(server).trim();
        if (active !== undefined)
            filter.active = active === "true";
        const characters = await Character_1.default.find(filter);
        res.json(characters);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getCharacters = getCharacters;
const getCharacterById = async (req, res) => {
    try {
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        res.json(char);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getCharacterById = getCharacterById;
// ============================================================
// 🎒 Get all storage items across all characters
// GET /api/characters/storage/all
// ============================================================
const getAllStorage = async (req, res) => {
    try {
        const characters = await Character_1.default.find({}, {
            name: 1,
            role: 1,
            storage: 1
        });
        // Flatten all storage entries into a single list
        const result = characters.flatMap((char) => (char.storage || []).map((item) => ({
            characterId: char._id,
            characterName: char.name,
            role: char.role,
            ability: item.ability,
            level: item.level,
            used: item.used ?? false,
            receivedAt: item.receivedAt || new Date(0),
            sourceBoss: item.sourceBoss || null,
        })));
        res.json(result);
    }
    catch (err) {
        console.error("❌ getAllStorage error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.getAllStorage = getAllStorage;
const getAllAccounts = async (req, res) => {
    try {
        // Use .distinct() for fast unique list retrieval
        const accounts = await Character_1.default.distinct("account");
        return res.json(accounts);
    }
    catch (err) {
        console.error("❌ getAllAccounts error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.getAllAccounts = getAllAccounts;
