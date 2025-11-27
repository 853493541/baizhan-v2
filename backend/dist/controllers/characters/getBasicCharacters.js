"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBasicCharacters = void 0;
const Character_1 = __importDefault(require("../../models/Character"));
/**
 * Ultra-fast endpoint for schedule & UI modals.
 * Returns only minimal fields for performance.
 */
const getBasicCharacters = async (req, res) => {
    try {
        const t0 = Date.now();
        // ⚡ Only fetch minimal fields needed by UI
        const characters = await Character_1.default.find({}, "name account role server" // ⭐ include server
        ).lean();
        const t1 = Date.now();
        console.log(`⚡ getBasicCharacters: ${characters.length} chars in ${t1 - t0}ms`);
        return res.json(characters);
    }
    catch (err) {
        console.error("❌ getBasicCharacters error:", err);
        return res.status(500).json({ error: err.message });
    }
};
exports.getBasicCharacters = getBasicCharacters;
