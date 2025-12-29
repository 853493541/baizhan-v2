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

// ⭐ NEW: safe manual-edit controller
import { manualEditGroups } from "../controllers/playground/standardSchedules/manualEditGroups";

// ⭐ NEW: boss adjustment controller
import {
  updateGroupAdjustedBoss,
  getGroupAdjustedBoss,
} from "../controllers/playground/standardSchedules/bossAdjustController";

// ⭐ NEW: group lifecycle controllers (START / FINISH)
import {
  markGroupStarted,
  markGroupFinished,
} from "../controllers/playground/standardSchedules/groupLifecycleController";

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
// Full replace characters (Save button)
router.patch("/:id/characters", updateScheduleCharacters);

// Ultra-light instant toggle (add/remove)
router.patch("/:id/toggle-character", toggleScheduleCharacter);

/* -----------------------------------------------------
   🔹 GROUP KILLS (lightweight fetch)
----------------------------------------------------- */
// Get kills of one group
router.get("/:id/groups/:index/kills", getGroupKills);

/* -----------------------------------------------------
   🔹 GROUP UPDATES
----------------------------------------------------- */
// Solver — replace groups ENTIRELY (dangerous)
router.put("/:id", updateStandardSchedule);

// ⭐ Manual Edit — safe, updates ONLY characters
router.patch("/:id/manual-groups", manualEditGroups);

// Update only group status (generic)
router.patch("/:id/groups/:index/status", updateGroupStatus);

/* -----------------------------------------------------
   🔹 GROUP LIFECYCLE (NEW)
----------------------------------------------------- */
// Mark group started (sets startTime + status)
router.post("/:id/groups/:index/start", markGroupStarted);

// Mark group finished (sets endTime + status)
router.post("/:id/groups/:index/finish", markGroupFinished);

/* -----------------------------------------------------
   🔹 GROUP BOSS OVERRIDES
----------------------------------------------------- */
router.get(
  "/:id/groups/:index/adjusted-boss",
  getGroupAdjustedBoss
);

// Adjust boss for floor 90 / 100
router.patch(
  "/:id/groups/:index/adjust-boss",
  updateGroupAdjustedBoss
);

/* -----------------------------------------------------
   🔹 GROUP KILL RECORDS
----------------------------------------------------- */
// Update a kill record
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
