"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mapController_1 = require("../controllers/map/mapController");
const router = (0, express_1.Router)();
router.post("/", mapController_1.saveWeeklyMap); // Save/update current week
router.get("/", mapController_1.getWeeklyMap); // Get current week
router.delete("/", mapController_1.deleteWeeklyMap); // ✅ Delete current week
router.get("/past", mapController_1.getPastWeeklyMap);
router.get("/history", mapController_1.getWeeklyMapHistory);
router.post("/lock", mapController_1.lockWeeklyMap);
router.get("/stats", mapController_1.getWeeklyMapStats);
exports.default = router;
