import { Router } from "express";

/* ===============================
   Schedule-level controllers
================================ */
import {
  createStandardSchedule,
  getStandardSchedules,
  getStandardScheduleById,
  updateStandardSchedule,
  deleteStandardSchedule,
  updateGroupStatus,
  updateScheduleName,
  updateScheduleCharacters,
} from "../controllers/playground/standardScheduleController";

/* ===============================
   Summary
================================ */
import { getScheduleSummaryByWeek } from "../controllers/playground/standardSchedules/getScheduleSummaryByWeek";

/* ===============================
   Character toggles / edits
================================ */
import { toggleScheduleCharacter } from "../controllers/playground/standardSchedules/toggleScheduleCharacter";
import { manualEditGroups } from "../controllers/playground/standardSchedules/manualEditGroups";

/* ===============================
   Boss adjustments
================================ */
import {
  updateGroupAdjustedBoss,
  getGroupAdjustedBoss,
  toggleGroupDowngradedFloor,
  getGroupDowngradedFloors,
} from "../controllers/playground/standardSchedules/bossAdjustController";

/* ===============================
   Group lifecycle
================================ */
import {
  markGroupStarted,
  markGroupFinished,
} from "../controllers/playground/standardSchedules/groupLifecycleController";

/* ===============================
   ✅ GROUP KILLS (NEW, CORRECT)
================================ */
import {
  updateGroupKill,
  updateSecondaryDrop,
  deleteGroupKill,
  getGroupKills,
} from "../controllers/playground/standardSchedules/groupKills";

const router = Router();

/* -----------------------------------------------------
   🔹 HIGH-LEVEL SUMMARY
----------------------------------------------------- */
router.get("/summary", getScheduleSummaryByWeek);

/* -----------------------------------------------------
   🔹 CREATE & READ
----------------------------------------------------- */
router.post("/", createStandardSchedule);
router.get("/", getStandardSchedules);
router.get("/:id", getStandardScheduleById);

/* -----------------------------------------------------
   🔹 CHARACTERS
----------------------------------------------------- */
router.patch("/:id/characters", updateScheduleCharacters);
router.patch("/:id/toggle-character", toggleScheduleCharacter);

/* -----------------------------------------------------
   🔹 GROUP KILLS (FULL SET)
----------------------------------------------------- */
// Get kills for one group (lightweight)
router.get(
  "/:id/groups/:index/kills",
  getGroupKills
);

// Primary drop (overwrite floor)
router.put(
  "/:id/groups/:index/floor/:floor",
  updateGroupKill
);

// Secondary drop (replace / overwrite)
router.post(
  "/:id/groups/:index/floor/:floor/secondary-drop",
  updateSecondaryDrop
);

// Reset / delete kill (wipe both primary + secondary)
router.delete(
  "/:id/groups/:index/floor/:floor",
  deleteGroupKill
);

/* -----------------------------------------------------
   🔹 GROUP UPDATES
----------------------------------------------------- */
router.put("/:id", updateStandardSchedule);
router.patch("/:id/manual-groups", manualEditGroups);
router.patch("/:id/groups/:index/status", updateGroupStatus);

/* -----------------------------------------------------
   🔹 GROUP LIFECYCLE
----------------------------------------------------- */
router.post("/:id/groups/:index/start", markGroupStarted);
router.post("/:id/groups/:index/finish", markGroupFinished);

/* -----------------------------------------------------
   🔹 GROUP BOSS OVERRIDES
----------------------------------------------------- */
router.get(
  "/:id/groups/:index/adjusted-boss",
  getGroupAdjustedBoss
);

router.patch(
  "/:id/groups/:index/adjust-boss",
  updateGroupAdjustedBoss
);

/* -----------------------------------------------------
   🔹 GROUP FLOOR DOWNGRADE
----------------------------------------------------- */
router.patch(
  "/:id/groups/:index/downgrade-floor",
  toggleGroupDowngradedFloor
);

router.get(
  "/:id/groups/:index/downgraded-floors",
  getGroupDowngradedFloors
);

/* -----------------------------------------------------
   🔹 SCHEDULE META
----------------------------------------------------- */
router.patch("/:id/name", updateScheduleName);
router.delete("/:id", deleteStandardSchedule);

export default router;
