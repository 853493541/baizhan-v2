"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const standardScheduleController_1 = require("../controllers/playground/standardScheduleController");
const getScheduleSummaryByWeek_1 = require("../controllers/playground/standardSchedules/getScheduleSummaryByWeek");
const router = (0, express_1.Router)();
// ✅ Summary route must come first to avoid conflict with :id
router.get("/summary", getScheduleSummaryByWeek_1.getScheduleSummaryByWeek);
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
// ✅ Update schedule name
router.patch("/:id/name", standardScheduleController_1.updateScheduleName);
// ✅ Group routes
router.patch("/:id/groups/:index/status", standardScheduleController_1.updateGroupStatus);
router.put("/:id/groups/:index/floor/:floor", standardScheduleController_1.updateGroupKill);
router.delete("/:id/groups/:index/floor/:floor", standardScheduleController_1.deleteGroupKill);
exports.default = router;
