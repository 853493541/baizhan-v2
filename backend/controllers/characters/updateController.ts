import { Request, Response } from "express";
import mongoose from "mongoose";
import Character from "../../models/Character";
import AbilityHistory from "../../models/AbilityHistory";
import { normalizeDefenseAbilities } from "../../utils/normalizeDefenseAbilities";

// =====================================================
// ✅ Ability Management
// =====================================================

// ✅ Update abilities + record every change
export const updateCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body;
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const updated: Array<{ name: string; old: number; new: number }> = [];
    const historyEntries: any[] = [];

    for (const [name, level] of Object.entries(abilities)) {
      const newVal = Number(level);
      const oldVal =
        (char.abilities as any)?.get?.(name) ??
        (char.abilities as any)?.[name] ??
        0;

      if (newVal !== oldVal) {
        (char.abilities as any).set
          ? (char.abilities as any).set(name, newVal)
          : ((char.abilities as any)[name] = newVal);

        updated.push({ name, old: Number(oldVal), new: newVal });

        historyEntries.push({
          characterId: char._id,
          characterName: char.name,
          abilityName: name,
          beforeLevel: oldVal,
          afterLevel: newVal,
        });
      }
    }

    if (updated.length === 0) {
      return res.status(400).json({ error: "No abilities changed" });
    }

    // 🔑 Normalize derived defense abilities (ALWAYS)
    normalizeDefenseAbilities(char);

    await char.save();

    // ✅ insert history logs (explicit user changes only)
    if (historyEntries.length > 0) {
      await AbilityHistory.insertMany(historyEntries);
      console.log(
        `[AbilityHistory] Logged ${historyEntries.length} ability changes for ${char.name}`
      );
    }

    return res.json({ character: char, updated });
  } catch (err: any) {
    console.error("❌ updateCharacterAbilities error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// =====================================================
// ✅ Character Basic Info Management (unchanged)
// =====================================================

export const updateCharacter = async (req: Request, res: Response) => {
  try {
    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const { account, server, gender, class: charClass, role, active, name } =
      req.body;

    if (name !== undefined) char.name = String(name).trim();
    if (account !== undefined) char.account = String(account).trim();
    if (server !== undefined) char.server = server;
    if (gender !== undefined) char.gender = gender;
    if (role !== undefined) char.role = role;
    if (charClass !== undefined) char.class = String(charClass).trim();
    if (active !== undefined) char.active = Boolean(active);

    await char.save();
    res.json(char);
  } catch (err: any) {
    if (err?.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    }
    return res.status(500).json({ error: err.message });
  }
};

export const deleteCharacter = async (req: Request, res: Response) => {
  try {
    const deleted = await Character.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Character not found" });
    res.json({ message: "Character deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// ✅ Storage System
// =====================================================

// ➕ Add a drop to storage
export const addToStorage = async (req: Request, res: Response) => {
  try {
    const { ability, level, sourceBoss } = req.body;
    if (!ability || !level) {
      return res.status(400).json({ error: "ability and level are required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    (char as any).storage.push({
      ability,
      level,
      sourceBoss,
      receivedAt: new Date(),
      used: false,
    });

    await char.save();
    console.log(`[Storage] Added ${ability}${level}重 to ${char.name}'s storage.`);

    return res.json({ message: "Stored successfully", storage: char.storage });
  } catch (err: any) {
    console.error("❌ addToStorage error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 🧾 Get stored abilities list
export const getStorage = async (req: Request, res: Response) => {
  try {
    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    return res.json(char.storage || []);
  } catch (err: any) {
    console.error("❌ getStorage error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ⚙️ Use stored ability (apply to abilities + mark as used)
export const useStoredAbility = async (req: Request, res: Response) => {
  try {
    const { ability, level } = req.body;
    if (!ability || !level) {
      return res.status(400).json({ error: "ability and level are required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    // 1️⃣ Apply ability level
    const oldLevel =
      (char.abilities as any)?.get?.(ability) ??
      (char.abilities as any)?.[ability] ??
      0;

    (char.abilities as any).set
      ? (char.abilities as any).set(ability, level)
      : ((char.abilities as any)[ability] = level);

    // 2️⃣ Remove the used item from storage
    const before = (char as any).storage.length;
    (char as any).storage = (char as any).storage.filter(
      (item: any) => !(item.ability === ability && item.level === level)
    );
    const removed = before - (char as any).storage.length;

    // 🔑 Normalize derived defense abilities
    normalizeDefenseAbilities(char);

    // 3️⃣ Save
    await char.save();

    // 4️⃣ Log user-triggered history
    await AbilityHistory.create({
      characterId: char._id,
      characterName: char.name,
      abilityName: ability,
      beforeLevel: oldLevel,
      afterLevel: level,
    });

    console.log(
      `[Storage] ${char.name} used ${ability}${level}重 from storage (removed ${removed})`
    );

    return res.json({
      message: "Stored ability consumed successfully",
      removed,
      newLevel: level,
    });
  } catch (err: any) {
    console.error("❌ useStoredAbility error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteFromStorage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ability, level } = req.body;

    if (!ability || !level)
      return res.status(400).json({ error: "缺少参数 ability 或 level" });

    const char = await Character.findById(id);
    if (!char) return res.status(404).json({ error: "角色不存在" });

    char.storage = (char.storage || []).filter(
      (item: any) => !(item.ability === ability && item.level === level)
    );

    await char.save();
    res.json({ success: true, message: `已删除 ${ability}${level}重` });
  } catch (err: any) {
    console.error("❌ deleteFromStorage error:", err);
    res.status(500).json({ error: err.message });
  }
};
