import { Router } from "express";
import {
  createBossPlan,
  getBossPlans,
  getBossPlanById,
  updateBossPlan,
  deleteBossPlan,
} from "../controllers/playground/bossPlanController"

const router = Router();

router.post("/", createBossPlan);
router.get("/", getBossPlans);
router.get("/:id", getBossPlanById);
router.put("/:id", updateBossPlan);
router.delete("/:id", deleteBossPlan);

export default router;
