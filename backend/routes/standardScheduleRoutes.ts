import { Router } from "express";
import {
  createStandardSchedule,
  getStandardSchedules,
  getStandardScheduleById,
  updateStandardSchedule,
  deleteStandardSchedule,
  updateGroupStatus,
  updateGroupKill,
  deleteGroupKill,
  updateScheduleName,
  getGroupKills, // ✅ new controller
} from "../controllers/playground/standardScheduleController";
import { getScheduleSummaryByWeek } from "../controllers/playground/standardSchedules/getScheduleSummaryByWeek";

const router = Router();

// ✅ Summary route must come first to avoid conflict with :id
router.get("/summary", getScheduleSummaryByWeek);

// POST new standard schedule
router.post("/", createStandardSchedule);

// GET all standard schedules
router.get("/", getStandardSchedules);

// GET one standard schedule by ID (full data)
router.get("/:id", getStandardScheduleById);

// ✅ NEW: lightweight route to get only a group’s kills + status
router.get("/:id/groups/:index/kills", getGroupKills);

// UPDATE standard schedule groups
router.put("/:id", updateStandardSchedule);

// DELETE standard schedule by ID
router.delete("/:id", deleteStandardSchedule);

// ✅ Update schedule name
router.patch("/:id/name", updateScheduleName);

// ✅ Group routes
router.patch("/:id/groups/:index/status", updateGroupStatus);
router.put("/:id/groups/:index/floor/:floor", updateGroupKill);
router.delete("/:id/groups/:index/floor/:floor", deleteGroupKill);

export default router;
