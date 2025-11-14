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
  getGroupKills,
  updateScheduleCharacters, 
} from "../controllers/playground/standardScheduleController";

import { getScheduleSummaryByWeek } from "../controllers/playground/standardSchedules/getScheduleSummaryByWeek";

// ⭐ NEW: ultra-light toggle controller
import { toggleScheduleCharacter } from "../controllers/playground/standardSchedules/toggleScheduleCharacter";

const router = Router();

/* -----------------------------------------------------
   🔹 HIGH-LEVEL SUMMARY ROUTES (must come first)
----------------------------------------------------- */
router.get("/summary", getScheduleSummaryByWeek);

/* -----------------------------------------------------
   🔹 CREATE & READ
----------------------------------------------------- */
// Create a new standard schedule
router.post("/", createStandardSchedule);

// Get all schedules
router.get("/", getStandardSchedules);

// Get one schedule (full details)
router.get("/:id", getStandardScheduleById);

/* -----------------------------------------------------
   🔹 CHARACTERS (OLD + NEW)
----------------------------------------------------- */
// Full replace characters (used by Save button)
router.patch("/:id/characters", updateScheduleCharacters);

// ⭐ NEW: instant toggle add/remove character
router.patch("/:id/toggle-character", toggleScheduleCharacter);

/* -----------------------------------------------------
   🔹 GROUP KILLS (lightweight fetch)
----------------------------------------------------- */
// Get kills of one group
router.get("/:id/groups/:index/kills", getGroupKills);

/* -----------------------------------------------------
   🔹 UPDATE GROUPS / STATUS / KILLS
----------------------------------------------------- */
// Replace groups entirely
router.put("/:id", updateStandardSchedule);

// Update just the status of a group
router.patch("/:id/groups/:index/status", updateGroupStatus);

// Update specific kill record
router.put("/:id/groups/:index/floor/:floor", updateGroupKill);

// Delete kill record
router.delete("/:id/groups/:index/floor/:floor", deleteGroupKill);

/* -----------------------------------------------------
   🔹 SCHEDULE NAME / DELETE
----------------------------------------------------- */
// Rename schedule
router.patch("/:id/name", updateScheduleName);

// Delete schedule
router.delete("/:id", deleteStandardSchedule);

export default router;
