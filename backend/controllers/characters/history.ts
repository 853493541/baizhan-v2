import { Request, Response } from "express";
import mongoose from "mongoose";
import Character from "../../models/Character";
import AbilityHistory from "../../models/AbilityHistory";
import { highlightAbilities } from "../../utils/highlightAbilities";

/**
 * =====================================================
 * Helpers
 * =====================================================
 */

/**
 * Build date filter from ?days
 * Allowed values: 1 | 30 | 60 | 90
 * Missing / invalid => no date filter (ALL)
 */
function buildDateFilter(query: any) {
  const daysNum = Number(query.days);

  if ([1, 30, 60, 90].includes(daysNum)) {
    return {
      updatedAt: {
        $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
      },
    };
  }

  return {};
}

/**
 * =====================================================
 * Ability History Controllers
 * =====================================================
 */

/**
 * 🔹 Get ability update history
 * Filters:
 * - name (optional)
 * - ability (optional)
 * - days = 1 | 30 | 60 | 90 (optional)
 */
export const getAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { name, ability } = req.query;

    const filter: any = {
      ...buildDateFilter(req.query),
    };

    if (name) filter.characterName = name;
    if (ability) filter.abilityName = ability;

    const history = await AbilityHistory.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return res.json(history);
  } catch (err: any) {
    console.error("❌ getAbilityHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Important ability history only
 * Filters:
 * - name (optional)
 * - days = 1 | 30 | 60 | 90 (optional)
 */
export const getImportantAbilityHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { name } = req.query;

    const filter: any = {
      abilityName: { $in: highlightAbilities },
      ...buildDateFilter(req.query),
    };

    if (name) {
      filter.characterName = name;
    }

    const history = await AbilityHistory.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return res.json(history);
  } catch (err: any) {
    console.error("❌ getImportantAbilityHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Revert a single ability history record
 */
export const revertAbilityHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await AbilityHistory.findById(id);
    if (!history) {
      return res
        .status(404)
        .json({ error: "History record not found or already deleted" });
    }

    const char = await Character.findById(history.characterId);
    if (!char) {
      return res.status(404).json({ error: "Character not found" });
    }

    await Character.findByIdAndUpdate(char._id, {
      $set: { [`abilities.${history.abilityName}`]: history.beforeLevel },
    });

    await AbilityHistory.findByIdAndDelete(id);

    console.log(
      `[AbilityHistory] Reverted ${char.name} - ${history.abilityName} → ${history.beforeLevel}重`
    );

    return res.json({
      success: true,
      revertedTo: history.beforeLevel,
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
    if (!deleted) {
      return res.status(404).json({ error: "History record not found" });
    }

    console.log(`[AbilityHistory] Deleted history record ${id}`);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("❌ deleteAbilityHistory error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Batch revert multiple ability history records
 */
export const revertMultipleHistory = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids[] is required" });
    }

    const histories = await AbilityHistory.find({ _id: { $in: ids } });
    if (!histories.length) {
      return res.status(404).json({ error: "No history records found" });
    }

    const grouped = new Map<string, any[]>();

    for (const h of histories) {
      if (!h.characterId) continue;
      const charId = (h.characterId as mongoose.Types.ObjectId).toString();
      const list = grouped.get(charId) || [];
      list.push(h);
      grouped.set(charId, list);
    }

    for (const [charId, records] of grouped.entries()) {
      const setOps: Record<string, number> = {};
      for (const r of records) {
        setOps[`abilities.${r.abilityName}`] = r.beforeLevel;
      }
      await Character.findByIdAndUpdate(charId, { $set: setOps });
    }

    await AbilityHistory.deleteMany({ _id: { $in: ids } });

    console.log(
      `[AbilityHistory] Batch reverted ${ids.length} records across ${grouped.size} characters`
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
 * 🔹 Get latest ability update for a character
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
