import { Request, Response } from "express";
import StandardSchedule from "../../../models/StandardSchedule";
import { getGameWeekRange } from "../../../utils/weekUtils";

/**
 * Controller: getScheduleSummaryByWeek
 * ------------------------------------
 * Returns lightweight summaries of schedules within a given week,
 * or all schedules before that week if "before" query is provided.
 *
 * Example:
 *   GET /api/standard-schedules/summary?week=2025-W40
 *   GET /api/standard-schedules/summary?before=2025-W40
 */
export const getScheduleSummaryByWeek = async (req: Request, res: Response) => {
  try {
    const { week, before } = req.query;

    if (!week && !before) {
      return res
        .status(400)
        .json({ error: "Query parameter 'week' or 'before' is required" });
    }

    // 🔹 Compute the start and end of the specified game week
    const { start, end } = getGameWeekRange(String(week || before));

    // 🔹 Build MongoDB filter
    const filter: any = {};
    if (week) {
      // Current week → schedules created within week window
      filter.createdAt = { $gte: start, $lt: end };
    } else if (before) {
      // Past weeks → schedules created before start of given week
      filter.createdAt = { $lt: start };
    }

    // 🔹 Fetch lightweight summaries (no heavy population)
    const schedules = await StandardSchedule.find(filter)
      .select("_id name server createdAt characterCount groups.status")
      .sort({ createdAt: -1 })
      .lean();

    res.json(schedules);
  } catch (err) {
    console.error("❌ Error in getScheduleSummaryByWeek:", err);
    res.status(500).json({ error: "Failed to fetch schedule summaries" });
  }
};
