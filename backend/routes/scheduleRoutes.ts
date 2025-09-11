import express from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
} from "../controllers/playground/scheduleController";

const router = express.Router();

// POST /api/schedules → create new
router.post("/", createSchedule);

// GET /api/schedules → list all
router.get("/", getSchedules);

// GET /api/schedules/:id → get detail
router.get("/:id", getScheduleById);

// DELETE /api/schedules/:id → delete
router.delete("/:id", deleteSchedule);

export default router;
