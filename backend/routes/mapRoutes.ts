import express from "express";
import { saveWeeklyMap, getWeeklyMap } from "../controllers/map/mapController";

const router = express.Router();

router.post("/", saveWeeklyMap);
router.get("/", getWeeklyMap);

export default router;
