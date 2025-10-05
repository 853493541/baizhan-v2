import { Request, Response } from "express";
import mongoose from "mongoose";
import Character from "../../models/Character";
import AbilityHistory from "../../models/AbilityHistory"; // ✅ import new model

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
export const revertAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the log entry
    const history = await AbilityHistory.findById(id);
    if (!history)
      return res.status(404).json({ error: "History record not found" });

    // Find the character
    const char = await Character.findById(history.characterId);
    if (!char)
      return res.status(404).json({ error: "Character not found" });

    const abilityName = history.abilityName;
    const revertLevel = history.beforeLevel;

    // ✅ update ability back to previous level
    (char.abilities as any).set
      ? (char.abilities as any).set(abilityName, revertLevel)
      : ((char.abilities as any)[abilityName] = revertLevel);
    await char.save();

    // ✅ log this revert action
    await AbilityHistory.create({
      characterId: char._id,
      characterName: char.name,
      abilityName: abilityName,
      beforeLevel: history.afterLevel,
      afterLevel: revertLevel,
    });

    console.log(
      `[AbilityHistory] Reverted ${char.name} - ${abilityName} to ${revertLevel}重`
    );

    return res.json({
      message: "Ability reverted successfully",
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

// unchanged below ⬇️
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
