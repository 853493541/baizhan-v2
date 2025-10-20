import express from "express";
import {
  createTargetedPlan,
  getTargetedPlansSummary,
  getTargetedPlanDetail,
  updateTargetedPlan,
  deleteTargetedPlan,
} from "../controllers/targetedplan/controllers";

const router = express.Router();

// Summary (list view)
router.get("/", getTargetedPlansSummary);

// Detail (full view)
router.get("/:planId", getTargetedPlanDetail);

// Create / Update / Delete
router.post("/", createTargetedPlan);
router.put("/:planId", updateTargetedPlan);
router.delete("/:planId", deleteTargetedPlan);

export default router;
