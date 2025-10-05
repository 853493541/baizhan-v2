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

    // 🔍 Debug: what backend actually received
    console.log("📥 [Backend] Received payload:", {
      name,
      server,
      conflictLevel,
      characterCount,
      charactersCount: characters?.length,
      groupsCount: groups?.length,
      checkedAbilitiesPreview: Array.isArray(checkedAbilities)
        ? checkedAbilities.slice(0, 5) // only log first 5 entries
        : checkedAbilities,
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

    // 🔍 Debug: what Mongoose doc looks like before save
    console.log("📋 [Backend] Schedule doc before save:", {
      name: schedule.name,
      server: schedule.server,
      conflictLevel: schedule.conflictLevel,
      checkedAbilitiesPreview: schedule.checkedAbilities?.slice(0, 5),
      characterCount: schedule.characterCount,
      charactersCount: schedule.characters?.length,
      groupsCount: schedule.groups?.length,
    });

    await schedule.save();

    // 🔍 Debug: reload from DB to confirm what was actually persisted
    const saved = await StandardSchedule.findById(schedule._id).lean();
    console.log("💾 [Backend] Saved doc in DB (preview):", {
      id: saved?._id,
      checkedAbilitiesCount: saved?.checkedAbilities?.length,
      checkedAbilitiesPreview: saved?.checkedAbilities?.slice(0, 5),
    });

    console.log("✅ [Backend] Saved standard schedule with ID:", schedule._id);
    res.status(201).json(schedule);
  } catch (err) {
    console.error("❌ [Backend] Error creating standard schedule:", err);
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

    const groupIndex = parseInt(index);
    const floorNum = parseInt(floor);

    console.log(`⚡ Fast update (final): group ${groupIndex}, floor ${floorNum} in ${id}`);

    // Build new kill record
    const newKill = {
      floor: floorNum,
      boss,
      completed: !!(selection?.ability || selection?.noDrop),
      selection,
      recordedAt: new Date(),
    };

    // 🧩 Step 1: remove existing kill (if any)
    await StandardSchedule.updateOne(
      { _id: id, "groups.index": groupIndex },
      { $pull: { "groups.$.kills": { floor: floorNum } } }
    );

    // 🧩 Step 2: push new kill
    const updated = await StandardSchedule.findOneAndUpdate(
      { _id: id, "groups.index": groupIndex },
      { $push: { "groups.$.kills": newKill } },
      { new: true } // return updated document
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // 🧩 Step 3: extract just the updated group
    const updatedGroup = updated.groups?.find((g) => g.index === groupIndex);
    if (!updatedGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    console.log("✅ Updated group kill (fast final):", {
      groupIndex,
      floorNum,
      kills: updatedGroup.kills.length,
    });

    res.json({ success: true, updatedGroup });
  } catch (err) {
    console.error("❌ updateGroupKill error:", err);
    res.status(500).json({ error: "Failed to update group kill" });
  }
};


// ✅ Delete (reset) a single kill record inside a group by floor
export const deleteGroupKill = async (req: Request, res: Response) => {
  try {
    const { id, index, floor } = req.params;

    console.log(`🗑️ Deleting kill floor ${floor} of group ${index} in schedule ${id}`);

    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    const group = schedule.groups.find((g: any) => g.index === parseInt(index));
    if (!group) return res.status(404).json({ error: "Group not found" });

    const before = group.kills.length;
    group.kills = group.kills.filter((k: any) => k.floor !== parseInt(floor));
    const after = group.kills.length;

    if (before === after) {
      return res.status(404).json({ error: "Kill record not found for this floor" });
    }

    await schedule.save();
    console.log("✅ Deleted group kill:", { groupIndex: index, floor });

    const populated = await StandardSchedule.findById(id)
      .populate("characters")
      .populate("groups.characters");

    res.json(populated);
  } catch (err) {
    console.error("❌ Error deleting group kill:", err);
    res.status(500).json({ error: "Failed to delete group kill" });
  }
};
export const updateScheduleName = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const updated = await StandardSchedule.findByIdAndUpdate(
      id,
      { $set: { name: name.trim() } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Standard schedule not found" });
    }

    console.log("✏️ Updated schedule name:", updated._id, "->", updated.name);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating schedule name:", err);
    res.status(500).json({ error: "Failed to update schedule name" });
  }
};