import { Request, Response } from "express";
import WeeklyMap from "../../models/WeeklyMap";
import { getCurrentGameWeek } from "../../utils/weekUtils"; // ✅ updated import name

// Save or update this week's map
export const saveWeeklyMap = async (req: Request, res: Response) => {
  try {
    const week = getCurrentGameWeek(); // ✅ updated
    const { floors } = req.body;

    if (!floors) {
      return res.status(400).json({ error: "floors are required" });
    }

    const updated = await WeeklyMap.findOneAndUpdate(
      { week },
      { floors },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get this week's map
export const getWeeklyMap = async (_req: Request, res: Response) => {
  try {
    const week = getCurrentGameWeek(); // ✅ updated
    const map = await WeeklyMap.findOne({ week });
    if (!map) return res.status(404).json({ error: "No map for this week" });
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete current week's map
export const deleteWeeklyMap = async (_req: Request, res: Response) => {
  try {
    const week = getCurrentGameWeek(); // ✅ updated
    const result = await WeeklyMap.deleteOne({ week });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No map found for this week" });
    }
    res.json({ message: `Weekly map for ${week} deleted` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Fetch a specific past week (?week=2025-W38)
export const getPastWeeklyMap = async (req: Request, res: Response) => {
  try {
    const { week } = req.query;
    if (!week) {
      return res
        .status(400)
        .json({ error: "week query param is required (e.g. ?week=2025-W38)" });
    }

    const map = await WeeklyMap.findOne({ week });
    if (!map) return res.status(404).json({ error: `No map found for week ${week}` });

    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get all past weeks (history, newest → oldest)
export const getWeeklyMapHistory = async (_req: Request, res: Response) => {
  try {
    const currentWeek = getCurrentGameWeek(); // ✅ updated

    const maps = await WeeklyMap.find({ week: { $ne: currentWeek } })
      .sort({ week: -1 })
      .limit(5);

    res.json(maps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const lockWeeklyMap = async (_req: Request, res: Response) => {
  try {
    const week = getCurrentGameWeek(); // ✅ updated
    const updated = await WeeklyMap.findOneAndUpdate(
      { week },
      { locked: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "No map for this week" });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
