import { Request, Response } from "express";
import mongoose from "mongoose";
import Character from "../../models/Character";
import AbilityHistory from "../../models/AbilityHistory";

/**
 * =====================================================
 * ✅ Ability History Controllers
 * =====================================================
 */

/**
 * 🔹 Get ability update history (with optional filters)
 */
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

/**
 * 🔹 Revert a single ability record
 */
export const revertAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await AbilityHistory.findById(id);
    if (!history)
      return res
        .status(404)
        .json({ error: "History record not found or already deleted" });

    const char = await Character.findById(history.characterId);
    if (!char)
      return res.status(404).json({ error: "Character not found" });

    const abilityName = history.abilityName;
    const revertLevel = history.beforeLevel;

    await Character.findByIdAndUpdate(char._id, {
      $set: { [`abilities.${abilityName}`]: revertLevel },
    });

    await AbilityHistory.findByIdAndDelete(id);

    console.log(
      `[AbilityHistory] Silently reverted ${char.name} - ${abilityName} to ${revertLevel}重 (record ${id} deleted)`
    );

    return res.json({
      message: "Ability reverted successfully (no new history logged)",
      revertedTo: revertLevel,
    });
  } catch (err: any) {
    console.error("❌ revertAbilityHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Delete a single history record
 */
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

/**
 * 🔹 Batch revert multiple ability history records at once
 *    - Faster and atomic compared to individual requests
 */
export const revertMultipleHistory = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids[] is required" });
    }

    // 1️⃣ Fetch all requested history records
    const histories = await AbilityHistory.find({ _id: { $in: ids } });
    if (histories.length === 0) {
      return res.status(404).json({ error: "No history records found" });
    }

    // 2️⃣ Group history entries by character ID
    const grouped = new Map<string, any[]>();
    for (const h of histories) {
      if (!h.characterId) continue; // ✅ skip null/undefined
      const charId = (h.characterId as mongoose.Types.ObjectId).toString();
      const list = grouped.get(charId) || [];
      list.push(h);
      grouped.set(charId, list);
    }

    // 3️⃣ For each character, build bulk update
    for (const [charId, records] of grouped.entries()) {
      const setOps: Record<string, number> = {};
      for (const r of records) {
        setOps[`abilities.${r.abilityName}`] = r.beforeLevel;
      }
      await Character.findByIdAndUpdate(charId, { $set: setOps });
    }

    // 4️⃣ Delete all reverted history entries
    await AbilityHistory.deleteMany({ _id: { $in: ids } });

    console.log(
      `[AbilityHistory] Batch reverted ${ids.length} records across ${grouped.size} characters.`
    );

    return res.json({
      success: true,
      revertedCount: ids.length,
      affectedCharacters: grouped.size,
    });
  } catch (err: any) {
    console.error("❌ revertMultipleHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};
/**
 * 🔹 Get latest ability update for a specific character
 *    - Returns last updated ability name + time
 */
export const getLatestAbilityUpdate = async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    if (!characterId) {
      return res.status(400).json({ error: "characterId is required" });
    }

    const latest = await AbilityHistory.findOne({ characterId })
      .sort({ updatedAt: -1 })
      .select("abilityName afterLevel updatedAt")
      .lean();

    if (!latest) {
      return res.json({ message: "No update history found" });
    }

    return res.json({
      abilityName: latest.abilityName,
      level: latest.afterLevel,
      updatedAt: latest.updatedAt,
    });
  } catch (err: any) {
    console.error("❌ getLatestAbilityUpdate error:", err);
    return res.status(500).json({ error: err.message });
  }
};
