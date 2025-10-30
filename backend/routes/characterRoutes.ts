import express from "express";

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────
import { createCharacter } from "../controllers/characters/createController";
import {
  getCharacters,
  getCharacterById,
  getAllStorage, // ✅ global backpack endpoint
} from "../controllers/characters/getController";
import {
  updateCharacter,
  updateCharacterAbilities,
  deleteCharacter,
  addToStorage,
  getStorage,
  useStoredAbility,
  deleteFromStorage, // ✅ storage management
} from "../controllers/characters/updateController";
import {
  getAbilityHistory,
  revertAbilityHistory,
  deleteAbilityHistory,
  revertMultipleHistory, // ✅ new batch revert route
} from "../controllers/characters/history"; // ✅ history controller
import { compareCharacterAbilities } from "../controllers/characters/compareController";

const router = express.Router();

// ─────────────────────────────────────────────
// Character CRUD
// ─────────────────────────────────────────────
router.post("/", createCharacter);
router.get("/", getCharacters);
router.get("/:id", getCharacterById);
router.patch("/:id/abilities", updateCharacterAbilities);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);
router.post("/:id/compare-abilities", compareCharacterAbilities);

// ─────────────────────────────────────────────
// 🧾 Ability History
// ─────────────────────────────────────────────
router.get("/abilities/history", getAbilityHistory); // 获取技能历史
router.post("/abilities/history/batch/revert", revertMultipleHistory); // ✅ 批量撤回（must come before :id）
router.post("/abilities/history/:id/revert", revertAbilityHistory); // 单条撤回
router.delete("/abilities/history/:id", deleteAbilityHistory); // 删除历史记录

// ─────────────────────────────────────────────
// 🎒 Storage System (per-character endpoints)
// ─────────────────────────────────────────────
// POST /api/characters/:id/storage → add ability to storage
router.post("/:id/storage", addToStorage);

// GET /api/characters/:id/storage → get stored abilities
router.get("/:id/storage", getStorage);

// PUT /api/characters/:id/storage/use → use a stored ability
router.put("/:id/storage/use", useStoredAbility);

// DELETE /api/characters/:id/storage/delete → remove a stored ability
router.delete("/:id/storage/delete", deleteFromStorage);

// ─────────────────────────────────────────────
// 🎒 Global Storage Endpoint (Backpack Page)
// ─────────────────────────────────────────────
// ⚠️ Must be declared *after* per-character routes, but *before* /:id
router.get("/storage/all", getAllStorage);

export default router;
