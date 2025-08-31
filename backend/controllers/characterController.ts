import { Request, Response } from "express";
import Character from "../models/Character";
import Ability from "../models/Ability";

// Small helpers for consistent logs
const log = (...args: any[]) => console.log("[characters]", ...args);
const errlog = (...args: any[]) => console.error("[characters][ERROR]", ...args);

// ============================
// Create a new character
// ============================
export const createCharacter = async (req: Request, res: Response) => {
  try {
    const { name, account, server, gender, class: charClass, role, active } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!account) return res.status(400).json({ error: "Account is required" });

    const allowedServers = ["梦江南", "乾坤一掷", "唯我独尊"];
    const allowedGenders = ["男", "女"];
    const allowedRoles = ["DPS", "Tank", "Healer"];

    if (!allowedServers.includes(server)) {
      return res.status(400).json({ error: "Invalid server" });
    }
    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({ error: "Invalid gender" });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const isActive = active === undefined ? true : Boolean(active);

    const abilities = await Ability.find({});
    const abilityLevels: Record<string, number> = {};
    abilities.forEach((a) => (abilityLevels[a.name] = 0));

    const newCharacter = new Character({
      name,
      account,
      server,
      gender,
      class: charClass,
      role,
      active: isActive,
      abilities: abilityLevels,
    });

    await newCharacter.save();
    res.status(201).json(newCharacter);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
// ============================
// Get all characters
// ============================
export const getCharacters = async (req: Request, res: Response) => {
  try {
    const characters = await Character.find({});
    res.json(characters);
  } catch (err: any) {
    errlog("getCharacters exception:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Get one character by ID
// ============================
export const getCharacterById = async (req: Request, res: Response) => {
  try {
    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });
    res.json(char);
  } catch (err: any) {
    errlog("getCharacterById exception:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Update abilities (partial merge)
// ============================
export const updateCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body;
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const setOps: Record<string, number> = {};
    const updated: Array<{ name: string; old: number; new: number }> = [];
    const skipped: string[] = [];

    for (const [name, level] of Object.entries(abilities)) {
      const hasKey =
        (char.abilities as any)?.has?.(name) ||
        Object.prototype.hasOwnProperty.call(char.abilities || {}, name);

      if (hasKey) {
        const oldVal =
          (char.abilities as any)?.get?.(name) ??
          (char.abilities as any)?.[name] ??
          0;

        setOps[`abilities.${name}`] = Number(level);
        updated.push({ name, old: Number(oldVal), new: Number(level) });
      } else {
        skipped.push(name);
      }
    }

    if (Object.keys(setOps).length === 0) {
      return res
        .status(400)
        .json({ error: "No matching ability names to update", skipped });
    }

    const newDoc = await Character.findByIdAndUpdate(
      req.params.id,
      { $set: setOps },
      { new: true }
    );

    return res.json({ character: newDoc, updated, skipped });
  } catch (err: any) {
    errlog("updateCharacterAbilities exception:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ============================
// Update character (general info)
// ============================
export const updateCharacter = async (req: Request, res: Response) => {
  try {
    const { characterId, account, server, gender, class: charClass, role, active, name } = req.body;

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const allowedGenders = ["男", "女"];
    const allowedServers = ["梦江南", "乾坤一掷", "唯我独尊"];
    const allowedRoles = ["DPS", "Tank", "Healer"];

    if (gender !== undefined) {
      const g = gender === "male" ? "男" : gender === "female" ? "女" : gender;
      if (!allowedGenders.includes(g)) {
        return res.status(400).json({ error: "Invalid gender. Must be 男 or 女." });
      }
      char.gender = g;
    }

    if (server !== undefined) {
      if (!allowedServers.includes(server)) {
        return res.status(400).json({ error: "Invalid server." });
      }
      char.server = server;
    }

    if (role !== undefined) {
      const r = role === "治疗" ? "Healer" : role === "T" ? "Tank" : role;
      if (!allowedRoles.includes(r)) {
        return res.status(400).json({ error: "Invalid role. Must be DPS, Tank, or Healer." });
      }
      char.role = r;
    }

    if (name !== undefined) char.name = String(name).trim();

    if (account !== undefined) char.account = String(account).trim();
    if (charClass !== undefined) char.class = String(charClass).trim();
    if (active !== undefined) char.active = Boolean(active);

    await char.save();
    return res.json(char);
  } catch (err: any) {
    errlog("updateCharacter exception:", err);
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: "ValidationError", details: err.errors });
    }
    return res.status(500).json({ error: err.message });
  }
};

// ============================
// Delete character
// ============================
export const deleteCharacter = async (req: Request, res: Response) => {
  try {
    const deleted = await Character.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Character not found" });
    }
    res.json({ message: "Character deleted successfully" });
  } catch (err: any) {
    errlog("deleteCharacter exception:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Health check
// ============================
export const healthCheck = async (_req: Request, res: Response) => {
  try {
    res.json({ status: "ok", db: Character.db.name });
  } catch (err: any) {
    errlog("healthCheck exception:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Compare OCR abilities with stored data
// ============================
export const compareCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body;
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const abilityAliases: Record<string, string> = {
      "电昆吾": "电挈昆吾",
      "蛇召唤": "蝮蛇召唤",
      "枪法蛇": "枪法蝮蛇",
      "武倪召来": "武傀召来",
      "尸鬼封": "尸鬼封烬",
      "帝龙翔": "帝骖龙翔",
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

    for (const [rawName, level] of Object.entries(abilities)) {
      const name = abilityAliases[rawName] || rawName;
      const hasKey =
        (char.abilities as any)?.has?.(name) ||
        Object.prototype.hasOwnProperty.call(char.abilities || {}, name);

      if (hasKey) {
        const oldVal =
          (char.abilities as any)?.get?.(name) ??
          (char.abilities as any)?.[name] ??
          0;

        if (Number(oldVal) !== Number(level)) {
          toUpdate.push({ name, old: Number(oldVal), new: Number(level) });
        } else {
          unchanged.push({ name, value: Number(level) });
        }
      } else {
        ocrOnly.push(rawName);
      }
    }

    let abilityObj: Record<string, number> = {};
    if (char.abilities instanceof Map) {
      abilityObj = Object.fromEntries(char.abilities);
    } else if (typeof (char.abilities as any).toObject === "function") {
      abilityObj = (char.abilities as any).toObject();
    } else {
      abilityObj = char.abilities as Record<string, number>;
    }

    const normalizedOCRNames = new Set(
      Object.keys(abilities).map((raw) => abilityAliases[raw] || raw)
    );

    const dbOnly: string[] = [];
    for (const name of Object.keys(abilityObj)) {
      if (char.gender === "女" && femaleOnlyBan.has(name)) continue;
      if (char.gender === "男" && maleOnlyBan.has(name)) continue;
      if (ignoreAlways.has(name)) continue;
      if (!normalizedOCRNames.has(name)) dbOnly.push(name);
    }

    const filteredOcrOnly = ocrOnly.filter((rawName) => {
      const normalized = abilityAliases[rawName] || rawName;
      if (char.gender === "女" && femaleOnlyBan.has(normalized)) return false;
      if (char.gender === "男" && maleOnlyBan.has(normalized)) return false;
      if (ignoreAlways.has(normalized)) return false;
      return true;
    });

    return res.json({ toUpdate, unchanged, ocrOnly: filteredOcrOnly, dbOnly });
  } catch (err: any) {
    errlog("compareCharacterAbilities exception:", err);
    return res.status(500).json({ error: err.message });
  }
};
