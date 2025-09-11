import { Request, Response } from "express";
import Schedule from "../../models/Schedule";

// ✅ Create new schedule
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const {
      server,
      mode,
      conflictLevel,
      checkedAbilities,
      characterCount,
      characters,
      groups,
    } = req.body;

    console.log("📥 Creating schedule with data:", {
      server,
      mode,
      conflictLevel,
      checkedAbilities,
      characterCount,
      characters,
      groups,
    });

    const schedule = new Schedule({
      server,
      mode,
      conflictLevel,
      checkedAbilities,
      characterCount,
      characters,
      groups,
    });

    await schedule.save();
    console.log("✅ Saved schedule with ID:", schedule._id);

    res.status(201).json(schedule);
  } catch (err) {
    console.error("❌ Error creating schedule:", err);
    res.status(500).json({ error: "Failed to create schedule" });
  }
};

// ✅ Get all schedules
export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await Schedule.find()
      .sort({ createdAt: -1 })
      .populate("characters")
      .populate("groups.characters");

    console.log("📤 Returning", schedules.length, "schedules");
    res.json(schedules);
  } catch (err) {
    console.error("❌ Error fetching schedules:", err);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

// ✅ Get one schedule by ID
export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("characters")
      .populate("groups.characters");

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(schedule);
  } catch (err) {
    console.error("❌ Error fetching schedule:", err);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

// ✅ Delete schedule by ID
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting schedule:", err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};
