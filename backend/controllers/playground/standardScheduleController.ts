import { Request, Response } from "express";
import StandardSchedule from "../../models/StandardSchedule";

// ✅ Create new standard schedule
export const createStandardSchedule = async (req: Request, res: Response) => {
  try {
    const {
      name,
      server,
      conflictLevel,
      checkedAbilities,
      characterCount,
      characters,
      groups,
    } = req.body;

    console.log("📥 Creating standard schedule with data:", {
      name,
      server,
      conflictLevel,
      checkedAbilities,
      characterCount,
      characters,
      groups,
    });

    const schedule = new StandardSchedule({
      name: name || "未命名排表", // ✅ fallback if no name
      server,
      conflictLevel,
      checkedAbilities,
      characterCount,
      characters,
      groups,
    });

    await schedule.save();
    console.log("✅ Saved standard schedule with ID:", schedule._id);

    res.status(201).json(schedule);
  } catch (err) {
    console.error("❌ Error creating standard schedule:", err);
    res.status(500).json({ error: "Failed to create standard schedule" });
  }
};

// ✅ Get all standard schedules
export const getStandardSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await StandardSchedule.find()
      .sort({ createdAt: -1 })
      .populate("characters")
      .populate("groups.characters");

    console.log("📤 Returning", schedules.length, "standard schedules");
    res.json(schedules);
  } catch (err) {
    console.error("❌ Error fetching standard schedules:", err);
    res.status(500).json({ error: "Failed to fetch standard schedules" });
  }
};

// ✅ Get one standard schedule by ID
export const getStandardScheduleById = async (req: Request, res: Response) => {
  try {
    const schedule = await StandardSchedule.findById(req.params.id)
      .populate("characters")
      .populate("groups.characters");

    if (!schedule) {
      return res.status(404).json({ error: "Standard schedule not found" });
    }

    res.json(schedule);
  } catch (err) {
    console.error("❌ Error fetching standard schedule:", err);
    res.status(500).json({ error: "Failed to fetch standard schedule" });
  }
};

// ✅ Delete standard schedule by ID
export const deleteStandardSchedule = async (req: Request, res: Response) => {
  try {
    const deleted = await StandardSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Standard schedule not found" });
    }

    res.json({ message: "Standard schedule deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting standard schedule:", err);
    res.status(500).json({ error: "Failed to delete standard schedule" });
  }
};

// ✅ Update standard schedule groups (only groups, without wiping abilities/etc)
export const updateStandardSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groups } = req.body;

    console.log("📥 Updating groups for schedule:", id, "with groups:", groups);

    const updated = await StandardSchedule.findByIdAndUpdate(
      id,
      { $set: { groups } },   // ✅ only update groups field
      { new: true }
    )
      .populate("characters")
      .populate("groups.characters");

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Standard schedule not found" });
    }

    console.log("✅ Updated groups for schedule:", updated._id);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating standard schedule:", err);
    res.status(500).json({ error: "Failed to update standard schedule" });
  }
};
// ✅ Update a single group's status (not_started → started → finished)
export const updateGroupStatus = async (req: Request, res: Response) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;

    console.log(`📥 Updating status of group ${index} in schedule ${id} to ${status}`);

    const updated = await StandardSchedule.findOneAndUpdate(
      { _id: id, "groups.index": parseInt(index) },
      { $set: { "groups.$.status": status } },
      { new: true }
    )
      .populate("characters")
      .populate("groups.characters");

    if (!updated) {
      return res.status(404).json({ error: "Schedule or group not found" });
    }

    console.log("✅ Updated group status:", updated._id);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating group status:", err);
    res.status(500).json({ error: "Failed to update group status" });
  }
};

// ✅ Update or insert a single kill record inside a group
export const updateGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;
    const { boss, selection } = req.body;

    console.log(`📥 Updating kill floor ${floor} of group ${index} in schedule ${id}`, {
      boss,
      selection,
    });

    // Load schedule
    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const group = schedule.groups.find((g: any) => g.index === parseInt(index));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Find kill entry
    let kill = group.kills.find((k: any) => k.floor === parseInt(floor));
    if (kill) {
      // Update existing kill
      kill.boss = boss || kill.boss;
      kill.selection = selection;
      kill.completed = !!(selection?.ability || selection?.noDrop);
      kill.recordedAt = new Date();
    } else {
      // Insert new kill
      group.kills.push({
        floor: parseInt(floor),
        boss,
        completed: !!(selection?.ability || selection?.noDrop),
        selection,
        recordedAt: new Date(),
      });
    }

    await schedule.save();
    console.log("✅ Updated group kill:", { groupIndex: index, floor });

    const populated = await StandardSchedule.findById(id)
      .populate("characters")
      .populate("groups.characters");

    res.json(populated);
  } catch (err) {
    console.error("❌ Error updating group kill:", err);
    res.status(500).json({ error: "Failed to update group kill" });
  }
};
