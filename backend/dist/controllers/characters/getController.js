"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCharacterById = exports.getCharacters = void 0;
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
