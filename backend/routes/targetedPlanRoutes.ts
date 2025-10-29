import express from "express";
import {
  createTargetedPlan,
  getTargetedPlansSummary,
  getTargetedPlanDetail,
  updateTargetedPlan,
  deleteTargetedPlan,
  addDropRecord,
  getGroupDrops,
  deleteGroupDrop,
  resetTargetedPlan,
  updateGroupStatus,
} from "../controllers/targetedplan/controllers";

const router = express.Router();

// === Plan CRUD ===
router.get("/", getTargetedPlansSummary);
router.get("/:planId", getTargetedPlanDetail);
router.post("/", createTargetedPlan);
router.put("/:planId", updateTargetedPlan);
router.delete("/:planId", deleteTargetedPlan);

// === Group-level Drop Routes ===
router.post("/:planId/groups/:index/drops", addDropRecord);      // ✅ add drop
router.get("/:planId/groups/:index/drops", getGroupDrops);       // ✅ list drops
router.delete("/:planId/groups/:index/drops", deleteGroupDrop);  // ✅ delete drop
router.put("/:planId/groups/:index/status", updateGroupStatus);  // ✅ update status

// === 🔄 Reset entire plan ===
router.post("/:planId/reset", resetTargetedPlan); // ✅ <-- FIXED

export default router;
