import { Request, Response } from "express";
import mongoose from "mongoose";
import StandardSchedule from "../../../models/StandardSchedule";

/**
 * PATCH /api/standard-schedules/:id/toggle-character
 * Body:
 *   { characterId: string, add: boolean }
 *
 * Adds or removes a character from schedule.characters
 */
export const toggleScheduleCharacter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { characterId, add } = req.body;

    if (!characterId) {
      return res.status(400).json({ error: "characterId is required" });
    }

    // Validate ObjectId
    if (!mongoose.isValidObjectId(characterId)) {
      return res.status(400).json({ error: "Invalid characterId" });
    }

    const schedule = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Convert to Set of string IDs
    const idSet = new Set(
      (schedule.characters || []).map((c: any) => String(c))
    );

    if (add) {
      idSet.add(String(characterId));
    } else {
      idSet.delete(String(characterId));
    }

    // Convert back to ObjectId[]
    schedule.characters = Array.from(idSet).map(
      (cid) => new mongoose.Types.ObjectId(cid)
    );

    // ⭐ IMPORTANT: update characterCount
    schedule.characterCount = schedule.characters.length;

    await schedule.save();

    return res.json({
      success: true,
      characterCount: schedule.characterCount,
      characters: schedule.characters,
    });
  } catch (err) {
    console.error("❌ toggleScheduleCharacter error:", err);
    return res.status(500).json({ error: "Failed to toggle character" });
  }
};
