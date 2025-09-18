import express from "express";
import { getAllCatalogs } from "../controllers/characters/catalogController";

const router = express.Router();

// GET /api/catalogs → ["主力", "副号", "测试服"]
router.get("/", getAllCatalogs);

export default router;
