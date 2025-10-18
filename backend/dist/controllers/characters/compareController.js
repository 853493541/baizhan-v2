"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareCharacterAbilities = void 0;
const Character_1 = __importDefault(require("../../models/Character"));
const string_similarity_1 = __importDefault(require("string-similarity"));
const levenshtein = require("fast-levenshtein"); // ✅ require avoids TS type issues
const compareCharacterAbilities = async (req, res) => {
    try {
        const { abilities } = req.body;
        if (!abilities || typeof abilities !== "object") {
            return res.status(400).json({ error: "abilities object is required" });
        }
        const char = await Character_1.default.findById(req.params.id);
        if (!char)
            return res.status(404).json({ error: "Character not found" });
        // ✅ Aliases now support both exact and substring matches
        const abilityAliases = {
            "鬼封": "尸鬼封烬",
            "尸鬼封": "尸鬼封烬",
            "户鬼封": "尸鬼封烬",
            "尺鬼封": "尸鬼封烬",
            "帝穆龙翔": "帝骖龙翔",
            "骤身": "戮身",
            "武愧召来": "武傀召来",
            "电昆吾": "电挈昆吾",
            "短歌一": "短歌一觞",
            "蛇召唤": "蝮蛇召唤",
            "枪法蛇": "枪法蝮蛇",
            "武倪召来": "武傀召来",
            "帝龙翔": "帝骖龙翔",
            "身": "戮身", // ✅ handle truncation
        };
        const femaleOnlyBan = new Set(["顽抗", "巨猿劈山", "蛮熊碎颅击"]);
        const maleOnlyBan = new Set(["剑心通明", "帝骖龙翔"]);
        const ignoreAlways = new Set([
            "退山凝", "电挈昆吾", "立剑势", "震岳势", "流霞点绛", "霞袖回春",
            "云海听弦", "玉魄惊鸾", "无我无剑式", "月流斩", "三环套月式", "剑飞惊天",
        ]);
        const toUpdate = [];
        const unchanged = [];
        const ocrOnly = [];
        // Normalize abilities from DB
        let abilityObj = {};
        if (char.abilities instanceof Map) {
            abilityObj = Object.fromEntries(char.abilities);
        }
        else if (typeof char.abilities.toObject === "function") {
            abilityObj = char.abilities.toObject();
        }
        else {
            abilityObj = char.abilities;
        }
        const dbNames = Object.keys(abilityObj);
        const normalizedOCRNames = new Set();
        const seenUnmatched = new Set(); // prevent duplicate unmatched logs
        // 🔹 Process abilities from OCR input
        for (const [rawName, level] of Object.entries(abilities)) {
            // 🧹 Step 1: clean OCR text first (spaces, digits, invisible chars)
            let normalized = rawName
                .replace(/[0-9()\/]/g, "") // remove digits, (), /
                .replace(/\s+/g, "") // remove normal and full-width spaces
                .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width/invisible chars
                .trim();
            // 🚫 Step 1.5: skip empty or too short OCR fragments
            if (!normalized || normalized.length <= 1) {
                if (normalized.length === 1) {
                    console.log(`⚪ Ignored very short OCR fragment "${normalized}"`);
                }
                else {
                    console.log("⚪ Ignored empty OCR fragment");
                }
                continue;
            }
            // 🪞 Step 2: alias lookup (supports substring match)
            let aliasHit = null;
            for (const [aliasKey, realName] of Object.entries(abilityAliases)) {
                if (normalized === aliasKey || normalized.includes(aliasKey)) {
                    aliasHit = { aliasKey, realName };
                    break;
                }
            }
            if (aliasHit) {
                console.log(`🔄 Alias matched (via "${aliasHit.aliasKey}") "${normalized}" -> "${aliasHit.realName}"`);
                normalized = aliasHit.realName;
            }
            // 🧩 Step 3: skip gender restrictions
            if (char.gender === "女" && femaleOnlyBan.has(normalized))
                continue;
            if (char.gender === "男" && maleOnlyBan.has(normalized))
                continue;
            let targetName = normalized;
            const hasDirect = Object.prototype.hasOwnProperty.call(abilityObj, normalized);
            // --- Step 4: advanced matching (only if not direct match) ---
            if (!hasDirect) {
                // short-text fallback
                if (normalized.length <= 2) {
                    const candidate = dbNames.find((n) => n.includes(normalized));
                    if (candidate) {
                        console.log(`✅ Short-text match "${normalized}" -> "${candidate}"`);
                        targetName = candidate;
                    }
                    else {
                        console.log(`❌ No short-text match for "${normalized}"`);
                    }
                }
                // prefix fallback
                if (targetName === normalized) {
                    const prefixCandidate = dbNames.find((n) => normalized.startsWith(n));
                    if (prefixCandidate && prefixCandidate.length >= 3) {
                        console.log(`✅ Prefix match "${normalized}" -> "${prefixCandidate}"`);
                        targetName = prefixCandidate;
                    }
                }
                // fuzzy + Levenshtein distance (with head/tail tolerance)
                if (targetName === normalized) {
                    const { bestMatch } = string_similarity_1.default.findBestMatch(normalized, dbNames);
                    const distance = levenshtein.get(normalized, bestMatch.target);
                    const len = normalized.length;
                    const distOK = distance <= (len >= 4 ? 2 : 1);
                    const ratingOK = bestMatch.rating >= 0.78;
                    const missingHeadOrTail = (bestMatch.target.endsWith(normalized) ||
                        bestMatch.target.startsWith(normalized)) &&
                        (bestMatch.target.length - len) <= 2;
                    if (ratingOK || distOK || missingHeadOrTail) {
                        console.log(`✅ Matched "${normalized}" -> "${bestMatch.target}" (rating=${bestMatch.rating.toFixed(2)}, distance=${distance}, headTail=${missingHeadOrTail})`);
                        targetName = bestMatch.target;
                    }
                    else {
                        if (!seenUnmatched.has(normalized)) {
                            console.log(`❌ Unmatched OCR "${normalized}" (best="${bestMatch.target}", rating=${bestMatch.rating.toFixed(2)}, distance=${distance})`);
                            seenUnmatched.add(normalized);
                        }
                    }
                }
            }
            normalizedOCRNames.add(targetName);
            // --- Step 5: compare and categorize ---
            if (Object.prototype.hasOwnProperty.call(abilityObj, targetName)) {
                const oldVal = abilityObj[targetName] ?? 0;
                if (Number(oldVal) !== Number(level)) {
                    toUpdate.push({ name: targetName, old: Number(oldVal), new: Number(level) });
                }
                else {
                    unchanged.push({ name: targetName, value: Number(level) });
                }
            }
            else {
                if (!(char.gender === "女" && femaleOnlyBan.has(normalized)) &&
                    !(char.gender === "男" && maleOnlyBan.has(normalized))) {
                    ocrOnly.push(normalized);
                }
            }
        }
        // 🔹 Step 6: find DB-only abilities
        const dbOnly = [];
        for (const name of Object.keys(abilityObj)) {
            if (char.gender === "女" && femaleOnlyBan.has(name))
                continue;
            if (char.gender === "男" && maleOnlyBan.has(name))
                continue;
            if (ignoreAlways.has(name))
                continue;
            if (!normalizedOCRNames.has(name))
                dbOnly.push(name);
        }
        return res.json({ toUpdate, unchanged, ocrOnly, dbOnly });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.compareCharacterAbilities = compareCharacterAbilities;
