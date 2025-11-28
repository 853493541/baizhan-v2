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
// ⬇️ NEW CONTROLLER
export const getWeeklyMapStats = async (_req: Request, res: Response) => {
  try {
    const allWeeks = await WeeklyMap.find().lean();
    const currentWeek = getCurrentGameWeek(); // "2025-W16"
    const [currentYear, currentW] = currentWeek.split("-W").map(Number);
    const currentWeekNumber = currentYear * 52 + currentW;

    const floor90: Record<string, any> = {};
    const floor100: Record<string, any> = {};

    for (const week of allWeeks) {
      const [year, w] = week.week.split("-W").map(Number);
      const weekNumber = year * 52 + w;

      const f90 = week.floors?.["90"]?.boss;
      const f100 = week.floors?.["100"]?.boss;

      if (f90) {
        if (!floor90[f90]) {
          floor90[f90] = {
            count: 0,
            weeks: [],
            lastWeek: null,
            weeksAgo: null,
            _weekNumbers: []
          };
        }
        floor90[f90].count++;
        floor90[f90].weeks.push(week.week);
        floor90[f90]._weekNumbers.push(weekNumber);

        if (!floor90[f90].lastWeek || weekNumber > floor90[f90]._lastWeekNumber) {
          floor90[f90].lastWeek = week.week;
          floor90[f90]._lastWeekNumber = weekNumber;
        }
      }

      if (f100) {
        if (!floor100[f100]) {
          floor100[f100] = {
            count: 0,
            weeks: [],
            lastWeek: null,
            weeksAgo: null,
            _weekNumbers: []
          };
        }
        floor100[f100].count++;
        floor100[f100].weeks.push(week.week);
        floor100[f100]._weekNumbers.push(weekNumber);

        if (!floor100[f100].lastWeek || weekNumber > floor100[f100]._lastWeekNumber) {
          floor100[f100].lastWeek = week.week;
          floor100[f100]._lastWeekNumber = weekNumber;
        }
      }
    }

    // Compute weeksAgo and clean internal data
    for (const boss in floor90) {
      floor90[boss].weeksAgo =
        currentWeekNumber - floor90[boss]._lastWeekNumber;

      floor90[boss].weeks.sort(); // chronological ascending
      delete floor90[boss]._lastWeekNumber;
      delete floor90[boss]._weekNumbers;
    }

    for (const boss in floor100) {
      floor100[boss].weeksAgo =
        currentWeekNumber - floor100[boss]._lastWeekNumber;

      floor100[boss].weeks.sort();
      delete floor100[boss]._lastWeekNumber;
      delete floor100[boss]._weekNumbers;
    }

    res.json({ floor90, floor100 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
