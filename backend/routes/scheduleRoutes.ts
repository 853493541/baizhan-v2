import { Router } from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
} from "../controllers/playground/scheduleController";

const router = Router();

// POST new schedule
router.post("/", createSchedule);

// GET all schedules
router.get("/", getSchedules);

// GET one schedule by ID
router.get("/:id", getScheduleById);

// DELETE schedule by ID
router.delete("/:id", deleteSchedule);

export default router;
