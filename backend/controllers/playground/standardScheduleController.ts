import { Request, Response } from "express";
import StandardSchedule from "../../models/StandardSchedule";
import Character from "../../models/Character";

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
        ? checkedAbilities.slice(0, 5)
        : checkedAbilities,
    });

    const schedule = new StandardSchedule({
      name: name || "未命名排表",
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
      return res.status(404).json({ error: "Standard schedule not found" });
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
      { $set: { groups } },
      { new: true }
    )
      .populate("characters")
      .populate("groups.characters");

    if (!updated) {
      return res.status(404).json({ error: "Standard schedule not found" });
    }

    console.log("✅ Updated groups for schedule:", updated._id);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating standard schedule:", err);
    res.status(500).json({ error: "Failed to update standard schedule" });
  }
};

// ✅ Update a single group's status
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


// ✅ Update schedule name
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
// ✅ Get only one group's kills (and status)

export const updateScheduleCharacters = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { characterIds } = req.body;

    console.log("📥 Updating schedule characters:", {
      scheduleId: id,
      characterIdsCount: Array.isArray(characterIds) ? characterIds.length : "invalid",
    });

    if (!Array.isArray(characterIds)) {
      return res.status(400).json({ error: "characterIds must be an array" });
    }

    // 1️⃣ Validate characters exist in DB
    const chars = await Character.find({ _id: { $in: characterIds } });
    if (chars.length !== characterIds.length) {
      return res.status(400).json({
        error: "Some character IDs do not exist",
        received: characterIds.length,
        found: chars.length,
      });
    }

    // 2️⃣ Load schedule
    const schedule: any = await StandardSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Standard schedule not found" });
    }

    // 3️⃣ Update characters field
    schedule.characters = characterIds;

    // 4️⃣ Clear all groups because membership changed
    if (Array.isArray(schedule.groups)) {
      schedule.groups = schedule.groups.map((g: any) => ({
        ...g,
        characters: [],
        kills: g.kills || [],
      }));
    }

    await schedule.save();

    // 5️⃣ Return populated version so frontend gets full objects
    const populated = await StandardSchedule.findById(id)
      .populate("characters")
      .populate("groups.characters");

    console.log("✅ Updated schedule characters:", {
      id,
      characterCount: schedule.characters.length,
    });

    res.json(populated);
  } catch (err) {
    console.error("❌ Error updating schedule characters:", err);
    res.status(500).json({ error: "Failed to update schedule characters" });
  }
};