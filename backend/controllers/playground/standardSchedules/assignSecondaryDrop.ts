import { Request, Response } from "express";
import mongoose from "mongoose";
import StandardSchedule from "../../../models/StandardSchedule";

/**
 * POST /api/standard-schedules/:id/groups/:index/floor/:floor/secondary-drop
 * Body: { selection: { ability, level, characterId?, noDrop?, status? } }
 */
export const assignSecondaryDrop = async (req: Request, res: Response) => {
  try {
    // ✅ match your router params: :id, :index, :floor
    const scheduleId = req.params.id;
    const groupIndexRaw = req.params.index;
    const floorRaw = req.params.floor;

    const groupIndex = Number(groupIndexRaw);
    const floor = Number(floorRaw);

    // ✅ frontend sends { selection: {...} }
    const selection = req.body?.selection;

    console.log("[assignSecondaryDrop] params:", {
      scheduleId,
      groupIndexRaw,
      groupIndex,
      floorRaw,
      floor,
    });
    console.log("[assignSecondaryDrop] body:", req.body);

    if (!scheduleId || Number.isNaN(groupIndex) || Number.isNaN(floor)) {
      return res.status(400).json({
        error: "Invalid params. Expected :id, :index, :floor",
        received: { scheduleId, groupIndexRaw, floorRaw },
      });
    }

    if (!selection || typeof selection !== "object") {
      return res.status(400).json({
        error: "Missing or invalid payload. Expected { selection: {...} }",
        receivedBody: req.body,
      });
    }

    const schedule = await StandardSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    const group = schedule.groups?.find((g: any) => g.index === groupIndex);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const kill = group.kills?.find((k: any) => k.floor === floor);
    if (!kill) return res.status(404).json({ error: "Kill record not found" });

    // ✅ must have primary
    if (!kill.selection) {
      return res.status(400).json({
        error: "Primary drop must exist before assigning secondary drop",
      });
    }

    /**
     * ✅ IMPORTANT FIX:
     * Mongoose may hydrate selectionSecondary with defaults (e.g. {status:'assigned'})
     * even if MongoDB does NOT have this field.
     *
     * So: treat it as "already exists" ONLY if it has REAL content.
     */
    const existing = kill.selectionSecondary;
    const secondaryHasRealValue =
      !!existing &&
      (existing.noDrop === true ||
        !!existing.ability ||
        !!existing.characterId);

    if (secondaryHasRealValue) {
      return res.status(400).json({
        error: "Secondary drop already exists for this floor",
        existing: existing,
      });
    }

    const normalizedSelection = {
      ability: selection.ability,
      level: selection.level,
      noDrop: selection.noDrop === true,
      status: selection.status || "assigned",
      characterId: selection.characterId
        ? new mongoose.Types.ObjectId(selection.characterId)
        : undefined,
    };

    // ✅ overwrite default/empty object safely
    kill.selectionSecondary = normalizedSelection;

    // make sure mongoose marks nested arrays modified
    schedule.markModified("groups");

    await schedule.save();

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
    return res.status(500).json({ error: "Internal server error" });
  }
};
