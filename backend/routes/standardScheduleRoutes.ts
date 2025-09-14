import { Router } from "express";
import {
  createStandardSchedule,
  getStandardSchedules,
  getStandardScheduleById,
  updateStandardSchedule,
  deleteStandardSchedule,
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

export default router;
