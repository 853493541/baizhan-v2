"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const standardScheduleController_1 = require("../controllers/playground/standardScheduleController");
const getScheduleSummaryByWeek_1 = require("../controllers/playground/standardSchedules/getScheduleSummaryByWeek");
// ⭐ NEW: ultra-light toggle controller
const toggleScheduleCharacter_1 = require("../controllers/playground/standardSchedules/toggleScheduleCharacter");
const router = (0, express_1.Router)();
/* -----------------------------------------------------
   🔹 HIGH-LEVEL SUMMARY ROUTES (must come first)
----------------------------------------------------- */
router.get("/summary", getScheduleSummaryByWeek_1.getScheduleSummaryByWeek);
/* -----------------------------------------------------
   🔹 CREATE & READ
----------------------------------------------------- */
// Create a new standard schedule
router.post("/", standardScheduleController_1.createStandardSchedule);
// Get all schedules
router.get("/", standardScheduleController_1.getStandardSchedules);
// Get one schedule (full details)
router.get("/:id", standardScheduleController_1.getStandardScheduleById);
/* -----------------------------------------------------
   🔹 CHARACTERS (OLD + NEW)
----------------------------------------------------- */
// Full replace characters (used by Save button)
router.patch("/:id/characters", standardScheduleController_1.updateScheduleCharacters);
// ⭐ NEW: instant toggle add/remove character
router.patch("/:id/toggle-character", toggleScheduleCharacter_1.toggleScheduleCharacter);
/* -----------------------------------------------------
   🔹 GROUP KILLS (lightweight fetch)
----------------------------------------------------- */
// Get kills of one group
router.get("/:id/groups/:index/kills", standardScheduleController_1.getGroupKills);
/* -----------------------------------------------------
   🔹 UPDATE GROUPS / STATUS / KILLS
----------------------------------------------------- */
// Replace groups entirely
router.put("/:id", standardScheduleController_1.updateStandardSchedule);
// Update just the status of a group
router.patch("/:id/groups/:index/status", standardScheduleController_1.updateGroupStatus);
// Update specific kill record
router.put("/:id/groups/:index/floor/:floor", standardScheduleController_1.updateGroupKill);
// Delete kill record
router.delete("/:id/groups/:index/floor/:floor", standardScheduleController_1.deleteGroupKill);
/* -----------------------------------------------------
   🔹 SCHEDULE NAME / DELETE
----------------------------------------------------- */
// Rename schedule
router.patch("/:id/name", standardScheduleController_1.updateScheduleName);
// Delete schedule
router.delete("/:id", standardScheduleController_1.deleteStandardSchedule);
exports.default = router;
