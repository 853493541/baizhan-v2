import express from "express";
import { createCharacter } from "../controllers/characters/createController";
import { getCharacters, getCharacterById } from "../controllers/characters/getController";
import {
  updateCharacter,
  updateCharacterAbilities,
  deleteCharacter,
  getAbilityHistory,
  revertAbilityHistory,   // ✅ new import
  deleteAbilityHistory,   // ✅ new import
} from "../controllers/characters/updateController";
import { compareCharacterAbilities } from "../controllers/characters/compareController";

const router = express.Router();

router.post("/", createCharacter);
router.get("/", getCharacters);
router.get("/:id", getCharacterById);
router.patch("/:id/abilities", updateCharacterAbilities);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);
router.post("/:id/compare-abilities", compareCharacterAbilities);

// ✅ Ability history routes
// Example: GET /api/characters/abilities/history?name=剑心猫猫糕&ability=引燃&limit=100
router.get("/abilities/history", getAbilityHistory);

// ✅ Revert an ability to previous level
// POST /api/characters/abilities/history/:id/revert
router.post("/abilities/history/:id/revert", revertAbilityHistory);

// ✅ Delete a history record (does NOT change character)
router.delete("/abilities/history/:id", deleteAbilityHistory);

export default router;
