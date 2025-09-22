import { Router } from "express";
import {
  saveWeeklyMap,
  getWeeklyMap,
  deleteWeeklyMap,
  getPastWeeklyMap,
  getWeeklyMapHistory,
} from "../controllers/map/mapController";

const router = Router();

router.post("/", saveWeeklyMap);        // Save/update current week
router.get("/", getWeeklyMap);          // Get current week
router.delete("/", deleteWeeklyMap);    // ✅ Delete current week
router.get("/past", getPastWeeklyMap);
router.get("/history", getWeeklyMapHistory);  

export default router;
