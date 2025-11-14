import express from "express";

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────
import { createCharacter } from "../controllers/characters/createController";
import {
  getCharacters,
  getCharacterById,
  getAllAccounts,
  getAllStorage,
} from "../controllers/characters/getController";
import {
  updateCharacter,
  updateCharacterAbilities,
  deleteCharacter,
  addToStorage,
  getStorage,
  useStoredAbility,
  deleteFromStorage,
} from "../controllers/characters/updateController";
import {
  getAbilityHistory,
  revertAbilityHistory,
  deleteAbilityHistory,
  revertMultipleHistory,
  getLatestAbilityUpdate,
} from "../controllers/characters/history";
import { compareCharacterAbilities } from "../controllers/characters/compareController";

// ⭐ NEW ultra-fast controller
import { getBasicCharacters } from "../controllers/characters/getBasicCharacters";

const router = express.Router();

// ─────────────────────────────────────────────
// ⚡ NEW Ultra-light Characters Endpoint
// MUST come BEFORE "/:id" or it'll conflict
// ─────────────────────────────────────────────
router.get("/basic", getBasicCharacters);

// ─────────────────────────────────────────────
// Character Metadata
// ─────────────────────────────────────────────
router.get("/accounts", getAllAccounts); 

// ─────────────────────────────────────────────
// Character CRUD
// ─────────────────────────────────────────────
router.post("/", createCharacter);
router.get("/", getCharacters);             // full characters
router.get("/:id", getCharacterById);
router.patch("/:id/abilities", updateCharacterAbilities);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);
router.post("/:id/compare-abilities", compareCharacterAbilities);

// ─────────────────────────────────────────────
// 🧾 Ability History
// ⚠️ Specific routes first
// ─────────────────────────────────────────────
router.get("/abilities/history", getAbilityHistory);
router.get("/abilities/history/latest/:characterId", getLatestAbilityUpdate);
router.post("/abilities/history/batch/revert", revertMultipleHistory);
router.post("/abilities/history/:id/revert", revertAbilityHistory);
router.delete("/abilities/history/:id", deleteAbilityHistory);

// ─────────────────────────────────────────────
// 🎒 Storage System (per-character)
// ─────────────────────────────────────────────
router.post("/:id/storage", addToStorage);
router.get("/:id/storage", getStorage);
router.put("/:id/storage/use", useStoredAbility);
router.delete("/:id/storage/delete", deleteFromStorage);

// ─────────────────────────────────────────────
// 🎒 Global Storage (backpack page)
// ─────────────────────────────────────────────
router.get("/storage/all", getAllStorage);

export default router;
