import { Request, Response } from "express";
import WeeklyMap from "../../models/WeeklyMap";
import { getCurrentGameWeek } from "../../utils/weekUtils"; // ✅ updated import name

function weekToNumber(week: string): number {
  const [year, w] = week.split("-W").map(Number);
  return year * 52 + w;
}

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
    const allMaps = await WeeklyMap.find().lean();
    if (!allMaps.length) {
      return res.json({
        nineStage: { pool: {}, floor90: {} },
        tenStage: { pool: {}, floor100: {} }
      });
    }

    const currentWeek = getCurrentGameWeek();
    const currentWeekNum = weekToNumber(currentWeek);

    // ---------- Storage ----------
    const pool9: Record<string, any> = {};      // 81–89
    const special90: Record<string, any> = {};  // 90

    const pool10: Record<string, any> = {};      // 91–99
    const special100: Record<string, any> = {};  // 100

    // ---------- Process each map ----------
    for (const weekDoc of allMaps) {
      const weekId = weekDoc.week;
      const weekNum = weekToNumber(weekId);

      // floors is a plain object because .lean() was used
      const floors = weekDoc.floors as Record<string, { boss: string }>;

      // ----- 9阶 pool (81–89) -----
      for (let f = 81; f <= 89; f++) {
        const boss = floors[String(f)]?.boss;
        if (!boss) continue;

        if (!pool9[boss]) {
          pool9[boss] = {
            count: 0,
            weeks: [],
            lastWeek: null,
            weeksAgo: null,
            _lastWeekNumber: 0
          };
        }

        pool9[boss].count += 1;
        pool9[boss].weeks.push(weekId);

        if (weekNum > pool9[boss]._lastWeekNumber) {
          pool9[boss]._lastWeekNumber = weekNum;
          pool9[boss].lastWeek = weekId;
        }
      }

      // ----- Floor 90 special -----
      const boss90 = floors["90"]?.boss;
      if (boss90) {
        if (!special90[boss90]) {
          special90[boss90] = {
            count: 0,
            weeks: [],
            lastWeek: null,
            weeksAgo: null,
            _lastWeekNumber: 0
          };
        }

        special90[boss90].count += 1;
        special90[boss90].weeks.push(weekId);

        if (weekNum > special90[boss90]._lastWeekNumber) {
          special90[boss90]._lastWeekNumber = weekNum;
          special90[boss90].lastWeek = weekId;
        }
      }

      // ----- 十阶 pool (91–99) -----
      for (let f = 91; f <= 99; f++) {
        const boss = floors[String(f)]?.boss;
        if (!boss) continue;

        if (!pool10[boss]) {
          pool10[boss] = {
            count: 0,
            weeks: [],
            lastWeek: null,
            weeksAgo: null,
            _lastWeekNumber: 0
          };
        }

        pool10[boss].count += 1;
        pool10[boss].weeks.push(weekId);

        if (weekNum > pool10[boss]._lastWeekNumber) {
          pool10[boss]._lastWeekNumber = weekNum;
          pool10[boss].lastWeek = weekId;
        }
      }

      // ----- Floor 100 special -----
      const boss100 = floors["100"]?.boss;
      if (boss100) {
        if (!special100[boss100]) {
          special100[boss100] = {
            count: 0,
            weeks: [],
            lastWeek: null,
            weeksAgo: null,
            _lastWeekNumber: 0
          };
        }

        special100[boss100].count += 1;
        special100[boss100].weeks.push(weekId);

        if (weekNum > special100[boss100]._lastWeekNumber) {
          special100[boss100]._lastWeekNumber = weekNum;
          special100[boss100].lastWeek = weekId;
        }
      }
    }

    // ---------- Compute weeksAgo + cleanup ----------
    const finalize = (obj: Record<string, any>) => {
      for (const boss in obj) {
        const b = obj[boss];

        b.weeks.sort(); // chronological
        b.weeksAgo = currentWeekNum - b._lastWeekNumber;

        delete b._lastWeekNumber;
      }
    };

    finalize(pool9);
    finalize(special90);
    finalize(pool10);
    finalize(special100);

    // ---------- Final Response ----------
    res.json({
      nineStage: {
        pool: pool9,
        floor90: special90
      },
      tenStage: {
        pool: pool10,
        floor100: special100
      }
    });

  } catch (err: any) {
    console.error("Stats generation failed:", err);
    res.status(500).json({ error: err.message });
  }
};