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

// ✅ group status & kills
router.patch("/:id/groups/:index/status", updateGroupStatus);
router.patch("/:id/groups/:index/kills/:floor", updateGroupKill);
router.delete("/:id/groups/:index/kills/:floor", deleteGroupKill); // ✅ FIXED
export default router;
