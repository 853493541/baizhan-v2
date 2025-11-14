import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";

export const manualEditGroups = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groups: incoming } = req.body;

    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: "groups must be an array" });
    }

    // Load schedule
    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Map index → characters[]
    const map = new Map(
      incoming.map((g: any) => [g.index, g.characters || []])
    );

    // Update characters ONLY
    schedule.groups = schedule.groups.map((old: any) => {
      const newChars = map.get(old.index);
      if (!newChars) return old; // unchanged if frontend didn't include it
      return { ...old, characters: newChars };
    });

    await schedule.save();

    // repopulate to return full objects
    const updated = await StandardSchedule.findById(id)
      .populate("characters")
      .populate("groups.characters");

    res.json({ success: true, schedule: updated });

  } catch (err) {
    console.error("❌ manualEditGroups error:", err);
    res.status(500).json({ error: "Failed to manually edit groups" });
  }
};
