import { Request, Response } from "express";
import mongoose from "mongoose";
import Character from "../../models/Character";
import AbilityHistory from "../../models/AbilityHistory";

// =====================================================
// ✅ Ability Management (existing functionality)
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

    const setOps: Record<string, number> = {};
    const updated: Array<{ name: string; old: number; new: number }> = [];
    const historyEntries: any[] = [];

    for (const [name, level] of Object.entries(abilities)) {
      const newVal = Number(level);
      const oldVal =
        (char.abilities as any)?.get?.(name) ??
        (char.abilities as any)?.[name] ??
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
    const newDoc = await Character.findByIdAndUpdate(
      req.params.id,
      { $set: setOps },
      { new: true }
    );

    // ✅ insert history logs (if any)
    if (historyEntries.length > 0) {
      await AbilityHistory.insertMany(historyEntries);
      console.log(
        `[AbilityHistory] Logged ${historyEntries.length} ability changes for ${char.name}`
      );
    }

    return res.json({ character: newDoc, updated });
  } catch (err: any) {
    console.error("❌ updateCharacterAbilities error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ✅ New read endpoint: get ability update history (filtered)
export const getAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { name, ability, limit } = req.query;
    const filter: any = {};
    if (name) filter.characterName = name;
    if (ability) filter.abilityName = ability;
    const limitNum = Number(limit) || 200;

    const history = await AbilityHistory.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limitNum)
      .lean();

    return res.json(history);
  } catch (err: any) {
    console.error("❌ getAbilityHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Revert a single ability record
// ✅ Revert a single ability record without triggering new update logs
// ✅ Revert a single ability record silently (no new history entry)
export const revertAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find the target history record
    const history = await AbilityHistory.findById(id);
    if (!history)
      return res
        .status(404)
        .json({ error: "History record not found or already deleted" });

    // 2️⃣ Find the corresponding character
    const char = await Character.findById(history.characterId);
    if (!char)
      return res.status(404).json({ error: "Character not found" });

    const abilityName = history.abilityName;
    const revertLevel = history.beforeLevel;

    // 3️⃣ Direct DB update (no .save() -> no middleware/log)
    await Character.findByIdAndUpdate(char._id, {
      $set: { [`abilities.${abilityName}`]: revertLevel },
    });

    // 4️⃣ Delete the original record after revert
    await AbilityHistory.findByIdAndDelete(id);

    console.log(
      `[AbilityHistory] Silently reverted ${char.name} - ${abilityName} to ${revertLevel}重 (record ${id} deleted)`
    );

    // 5️⃣ Send success response
    return res.json({
      message: "Ability reverted successfully (no new history logged)",
      revertedTo: revertLevel,
    });
  } catch (err: any) {
    console.error("❌ revertAbilityHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a history record (no ability changes)
export const deleteAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await AbilityHistory.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ error: "History record not found" });
    console.log(`[AbilityHistory] Deleted history record ${id}`);
    return res.json({ message: "History record deleted" });
  } catch (err: any) {
    console.error("❌ deleteAbilityHistory error:", err);
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
// ✅ New: Storage System (存入仓库 / 从仓库使用)
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

    // 1️⃣ Update ability level
    (char.abilities as any).set
      ? (char.abilities as any).set(ability, level)
      : ((char.abilities as any)[ability] = level);

    // 2️⃣ Mark item as used
    const stored = (char as any).storage.find(
      (item: any) => item.ability === ability && item.used === false
    );
    if (stored) stored.used = true;

    await char.save();

    // 3️⃣ Record in AbilityHistory
    await AbilityHistory.create({
      characterId: char._id,
      characterName: char.name,
      abilityName: ability,
      beforeLevel: 0, // old unknown
      afterLevel: level,
    });

    console.log(`[Storage] ${char.name} used stored ${ability}${level}重`);

    return res.json({
      message: "Ability used from storage successfully",
      character: char,
    });
  } catch (err: any) {
    console.error("❌ useStoredAbility error:", err);
    return res.status(500).json({ error: err.message });
  }
};
