import { Request, Response } from "express";
import WeeklyMap from "../../models/WeeklyMap";
import { getCurrentWeek } from "../../utils/weekUtils";

// Save or update this week's map
export const saveWeeklyMap = async (req: Request, res: Response) => {
  try {
    const week = getCurrentWeek();
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
    const week = getCurrentWeek();
    const map = await WeeklyMap.findOne({ week });
    if (!map) return res.status(404).json({ error: "No map for this week" });
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
