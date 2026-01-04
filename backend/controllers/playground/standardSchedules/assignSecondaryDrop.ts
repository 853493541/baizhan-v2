import { Request, Response } from "express";
import mongoose from "mongoose";
import StandardSchedule from "../../../models/StandardSchedule";

/**
 * Assign a SECONDARY drop to an existing kill record.
 *
 * Rules enforced:
 * 1. Schedule must exist
 * 2. Group must exist
 * 3. Kill record (floor) must exist
 * 4. Primary selection MUST already exist
 * 5. Secondary selection MUST NOT already exist
 *
 * This endpoint does NOT modify primary selection.
 */
export const assignSecondaryDrop = async (req: Request, res: Response) => {
  try {
    const {
      scheduleId,
      groupIndex,
      floor,
      selection,
    } = req.body;

    /* ===============================
       Basic validation
    ================================= */
    if (!scheduleId || groupIndex === undefined || floor === undefined) {
      return res.status(400).json({
        error: "Missing required fields: scheduleId, groupIndex, floor",
      });
    }

    if (!selection || typeof selection !== "object") {
      return res.status(400).json({
        error: "Missing or invalid selection payload",
      });
    }

    /* ===============================
       Load schedule
    ================================= */
    const schedule = await StandardSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups?.find(
      (g: any) => g.index === groupIndex
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const kill = group.kills?.find(
      (k: any) => k.floor === floor
    );

    if (!kill) {
      return res.status(404).json({ error: "Kill record not found" });
    }

    /* ===============================
       Safety rules
    ================================= */
    if (!kill.selection) {
      return res.status(400).json({
        error: "Primary drop must exist before assigning secondary drop",
      });
    }

    if (kill.selectionSecondary) {
      return res.status(400).json({
        error: "Secondary drop already exists for this floor",
      });
    }

    /* ===============================
       Normalize selection payload
    ================================= */
    const normalizedSelection = {
      ability: selection.ability,
      level: selection.level,
      noDrop: selection.noDrop === true,
      status: selection.status || "assigned",
      characterId: selection.characterId
        ? new mongoose.Types.ObjectId(selection.characterId)
        : undefined,
    };

    /* ===============================
       Assign secondary drop
    ================================= */
    kill.selectionSecondary = normalizedSelection;

    await schedule.save();

    /* ===============================
       Response
    ================================= */
    return res.json({
      success: true,
      message: "Secondary drop assigned successfully",
      kill: {
        floor: kill.floor,
        selection: kill.selection,
        selectionSecondary: kill.selectionSecondary,
      },
    });
  } catch (err) {
    console.error("[assignSecondaryDrop] error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
