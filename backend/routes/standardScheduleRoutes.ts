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
} from "../controllers/playground/standardScheduleController";

const router = Router();

// POST new standard schedule
router.post("/", createStandardSchedule);

// GET all standard schedules
router.get("/", getStandardSchedules);

// GET one standard schedule by ID
router.get("/:id", getStandardScheduleById);

// UPDATE standard schedule groups
router.put("/:id", updateStandardSchedule);

// DELETE standard schedule by ID
router.delete("/:id", deleteStandardSchedule);

// ✅ Update schedule name
router.patch("/:id/name", updateScheduleName);

// ✅ Group routes
router.patch("/:id/groups/:index/status", updateGroupStatus);
router.put("/:id/groups/:index/floor/:floor", updateGroupKill);     // ✅ fixed alignment
router.delete("/:id/groups/:index/floor/:floor", deleteGroupKill);  // ✅ fixed alignment

export default router;
