import { Request, Response } from "express";
import Character from "../../models/Character";
import stringSimilarity from "string-similarity";
const levenshtein = require("fast-levenshtein"); // ✅ require avoids TS type issues

export const compareCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body;
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const abilityAliases: Record<string, string> = {
      "帝穆龙翔": "帝骖龙翔",
      "骤身": "戮身",
      "武愧召来": "武傀召来",
      "电昆吾": "电挈昆吾",
      "短歌一": "短歌一觞",
      "蛇召唤": "蝮蛇召唤",
      "枪法蛇": "枪法蝮蛇",
      "武倪召来": "武傀召来",
      "尸鬼封": "尸鬼封烬",
      "帝龙翔": "帝骖龙翔",
      "身": "戮身", // ✅ handle truncation
    };

    const femaleOnlyBan = new Set(["顽抗", "巨猿劈山", "蛮熊碎颅击"]);
    const maleOnlyBan = new Set(["剑心通明", "帝骖龙翔"]);
    const ignoreAlways = new Set([
      "退山凝", "电挈昆吾", "立剑势", "震岳势", "流霞点绛", "霞袖回春",
      "云海听弦", "玉魄惊鸾", "无我无剑式", "月流斩", "三环套月式", "剑飞惊天",
    ]);

    const toUpdate: Array<{ name: string; old: number; new: number }> = [];
    const unchanged: Array<{ name: string; value: number }> = [];
    const ocrOnly: string[] = [];

    // Normalize abilities from DB
    let abilityObj: Record<string, number> = {};
    if (char.abilities instanceof Map) {
      abilityObj = Object.fromEntries(char.abilities);
    } else if (typeof (char.abilities as any).toObject === "function") {
      abilityObj = (char.abilities as any).toObject();
    } else {
      abilityObj = char.abilities as Record<string, number>;
    }
    const dbNames = Object.keys(abilityObj);

    const normalizedOCRNames = new Set<string>();

    for (const [rawName, level] of Object.entries(abilities)) {
      // Step 1: alias map
      let normalized = abilityAliases[rawName] || rawName;

      // Step 2: clean OCR noise (digits, parentheses, slashes)
      let cleaned = normalized.replace(/[0-9()\/]/g, "").trim();
      if (cleaned !== normalized) {
        console.log(`🧹 Cleaned OCR "${normalized}" -> "${cleaned}"`);
        normalized = cleaned;
      }

      // Skip banned/ignored
      if (char.gender === "女" && femaleOnlyBan.has(normalized)) continue;
      if (char.gender === "男" && maleOnlyBan.has(normalized)) continue;
      if (ignoreAlways.has(normalized)) continue;

      let targetName = normalized;
      const hasDirect = Object.prototype.hasOwnProperty.call(abilityObj, normalized);

      if (!hasDirect) {
        // Step 3a: short-text fallback
        if (normalized.length <= 2) {
          const candidate = dbNames.find(n => n.includes(normalized));
          if (candidate) {
            console.log(`✅ Short-text match "${normalized}" -> "${candidate}"`);
            targetName = candidate;
          } else {
            console.log(`❌ No short-text match for "${normalized}"`);
          }
        }

        // Step 3b: prefix fallback (handles trailing junk)
        if (targetName === normalized) {
          const prefixCandidate = dbNames.find(n => normalized.startsWith(n));
          if (prefixCandidate && prefixCandidate.length >= 3) {
            console.log(`✅ Prefix match "${normalized}" -> "${prefixCandidate}"`);
            targetName = prefixCandidate;
          }
        }

        // Step 4: fuzzy + distance
        if (targetName === normalized) {
          const { bestMatch } = stringSimilarity.findBestMatch(normalized, dbNames);
          const distance = levenshtein.get(normalized, bestMatch.target);

          if (bestMatch.rating >= 0.8 || distance <= 1) {
            console.log(
              `✅ Matched "${normalized}" -> "${bestMatch.target}" (rating=${bestMatch.rating.toFixed(
                2
              )}, distance=${distance})`
            );
            targetName = bestMatch.target;
          } else {
            console.log(
              `❌ Unmatched OCR "${normalized}" (best="${bestMatch.target}", rating=${bestMatch.rating.toFixed(
                2
              )}, distance=${distance})`
            );
          }
        }
      }

      normalizedOCRNames.add(targetName);

      if (Object.prototype.hasOwnProperty.call(abilityObj, targetName)) {
        const oldVal = abilityObj[targetName] ?? 0;
        if (Number(oldVal) !== Number(level)) {
          toUpdate.push({ name: targetName, old: Number(oldVal), new: Number(level) });
        } else {
          unchanged.push({ name: targetName, value: Number(level) });
        }
      } else {
        if (
          !(char.gender === "女" && femaleOnlyBan.has(normalized)) &&
          !(char.gender === "男" && maleOnlyBan.has(normalized)) &&
          !ignoreAlways.has(normalized)
        ) {
          ocrOnly.push(normalized);
        }
      }
    }

    const dbOnly: string[] = [];
    for (const name of Object.keys(abilityObj)) {
      if (char.gender === "女" && femaleOnlyBan.has(name)) continue;
      if (char.gender === "男" && maleOnlyBan.has(name)) continue;
      if (ignoreAlways.has(name)) continue;
      if (!normalizedOCRNames.has(name)) dbOnly.push(name);
    }

    return res.json({ toUpdate, unchanged, ocrOnly, dbOnly });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
