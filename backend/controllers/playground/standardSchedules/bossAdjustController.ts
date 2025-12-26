import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

/**
 * PATCH /api/standard-schedules/:id/groups/:index/adjust-boss
 * body: { floor: 90 | 100, boss: string }
 */
export const updateGroupAdjustedBoss = async (req: Request, res: Response) => {
  try {
    const { id, index } = req.params;
    const { floor, boss } = req.body;

    const groupIndex = parseInt(index, 10);

    // ✅ basic validation
    if (floor !== 90 && floor !== 100) {
      return res.status(400).json({
        error: "Only floor 90 or 100 can be adjusted",
      });
    }

    if (!boss || typeof boss !== "string") {
      return res.status(400).json({
        error: "boss is required",
      });
    }

    const field =
      floor === 90
        ? "groups.$.adjusted90"
        : "groups.$.adjusted100";

    // ✅ update only the override field
    const updated = await StandardSchedule.findOneAndUpdate(
      { _id: id, "groups.index": groupIndex },
      { $set: { [field]: boss } },
      { new: true }
    )
      .populate("characters")
      .populate("groups.characters");

    if (!updated) {
      return res.status(404).json({
        error: "Schedule or group not found",
      });
    }

    const updatedGroup = updated.groups.find(
      (g: any) => g.index === groupIndex
    );

    res.json({
      success: true,
      group: updatedGroup,
    });
  } catch (err) {
    console.error("❌ updateGroupAdjustedBoss error:", err);
    res.status(500).json({
      error: "Failed to update adjusted boss",
    });
  }
};
