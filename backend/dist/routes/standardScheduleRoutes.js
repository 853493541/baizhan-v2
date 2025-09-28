"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const standardScheduleController_1 = require("../controllers/playground/standardScheduleController");
const router = (0, express_1.Router)();
// POST new standard schedule
router.post("/", standardScheduleController_1.createStandardSchedule);
// GET all standard schedules
router.get("/", standardScheduleController_1.getStandardSchedules);
// GET one standard schedule by ID
router.get("/:id", standardScheduleController_1.getStandardScheduleById);
// UPDATE standard schedule groups
router.put("/:id", standardScheduleController_1.updateStandardSchedule);
// DELETE standard schedule by ID
router.delete("/:id", standardScheduleController_1.deleteStandardSchedule);
// ✅ group status & kills
router.patch("/:id/groups/:index/status", standardScheduleController_1.updateGroupStatus);
router.patch("/:id/groups/:index/kills/:floor", standardScheduleController_1.updateGroupKill);
router.delete("/:id/groups/:index/kills/:floor", standardScheduleController_1.deleteGroupKill); // ✅ FIXED
exports.default = router;
