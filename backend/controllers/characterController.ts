import { Request, Response } from "express";
import Character from "../models/Character";
import Ability from "../models/Ability";

// ============================
// Create a new character
// ============================
export const createCharacter = async (req: Request, res: Response) => {
  try {
    const { characterId, account, server, gender, class: charClass } = req.body;

    const existing = await Character.findOne({ characterId });
    if (existing) {
      return res.status(400).json({ error: "Character ID already exists" });
    }

    // preload all abilities at 0
    const abilities = await Ability.find({});
    const abilityLevels: { [key: string]: number } = {};
    abilities.forEach((a) => (abilityLevels[a.name] = 0));

    const newCharacter = new Character({
      characterId,
      account,
      server,
      gender,
      class: charClass,
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
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Update abilities (partial merge)
// ============================
export const updateCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body; // expected: { "万花金创药": 9, "阴阳术退散": 10 }
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
    console.error(err);
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
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Health check
// ============================
export const healthCheck = async (req: Request, res: Response) => {
  try {
    res.json({
      status: "ok",
      db: Character.db.name,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Compare OCR results with existing abilities
// ============================
export const compareCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body; // OCR result: { "万花金创药": 9, "阴阳术退散": 10 }
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const toUpdate: Array<{ name: string; old: number; new: number }> = [];
    const unchanged: Array<{ name: string; value: number }> = [];
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

        if (Number(oldVal) !== Number(level)) {
          toUpdate.push({ name, old: Number(oldVal), new: Number(level) });
        } else {
          unchanged.push({ name, value: Number(level) });
        }
      } else {
        skipped.push(name);
      }
    }

    return res.json({ toUpdate, unchanged, skipped });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
