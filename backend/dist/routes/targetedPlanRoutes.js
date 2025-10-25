"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers/targetedplan/controllers");
const router = express_1.default.Router();
// === Plan CRUD ===
router.get("/", controllers_1.getTargetedPlansSummary);
router.get("/:planId", controllers_1.getTargetedPlanDetail);
router.post("/", controllers_1.createTargetedPlan);
router.put("/:planId", controllers_1.updateTargetedPlan);
router.delete("/:planId", controllers_1.deleteTargetedPlan);
// === Group-level Drop Routes ===
router.post("/:planId/groups/:index/drops", controllers_1.addDropRecord); // ✅ add drop
router.get("/:planId/groups/:index/drops", controllers_1.getGroupDrops); // ✅ list drops
router.delete("/:planId/groups/:index/drops", controllers_1.deleteGroupDrop); // ✅ delete drop
router.put("/:planId/groups/:index/status", controllers_1.updateGroupStatus); // ✅ update status
// === 🔄 Reset entire plan ===
router.post("/:planId/reset", controllers_1.resetTargetedPlan); // ✅ <-- FIXED
exports.default = router;
