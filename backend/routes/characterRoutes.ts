import express from "express";

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────

// Create
import { createCharacter } from "../controllers/characters/createController";

// Get (FULL + misc)
import {
  getCharacters,
  getCharacterById,
  getAllAccounts,
  getAllStorage,
} from "../controllers/characters/getController";

// ⭐ Page-level lightweight list (NO abilities)

// ⭐ Ultra-basic (legacy / special use)
import { getBasicCharacters,getCharactersPageLightweight, getCharacterLightById } from "../controllers/characters/getBasicCharacters";

// Update / Delete
import {
  updateCharacter,
  updateCharacterAbilities,
  deleteCharacter,
  addToStorage,
  getStorage,
  useStoredAbility,
  deleteFromStorage,
} from "../controllers/characters/updateController";

// Ability history
import {
  getAbilityHistory,
  revertAbilityHistory,
  deleteAbilityHistory,
  revertMultipleHistory,
  getLatestAbilityUpdate,
} from "../controllers/characters/history";

// Compare
import { compareCharacterAbilities } from "../controllers/characters/compareController";

// Ranking
import { getCharacterRanking } from "../controllers/characters/getCharacterRanking";

// Tradables / Action
import { getCharacterTradables } from "../controllers/characters/ActionController";



import { filterCharactersPage } from "../controllers/characters/Filter";



const router = express.Router();


// ─────────────────────────────────────────────
// ⚠️ MOST SPECIFIC ROUTES FIRST (CRITICAL)
// ─────────────────────────────────────────────

// ───── Ultra-light / page-level lists ─────

// Character list page (everything EXCEPT abilities)
router.get("/page", getCharactersPageLightweight);

// Ultra-basic list (name/account/role/server only)
router.get("/basic", getBasicCharacters);

// Ranking list
router.get("/ranking", getCharacterRanking);

// Metadata
router.get("/accounts", getAllAccounts);


// ─────────────────────────────────────────────
// 🧾 Ability History (specific paths first)
// ─────────────────────────────────────────────

router.get("/abilities/history", getAbilityHistory);
router.get("/abilities/history/latest/:characterId", getLatestAbilityUpdate);
router.post("/abilities/history/batch/revert", revertMultipleHistory);
router.post("/abilities/history/:id/revert", revertAbilityHistory);
router.delete("/abilities/history/:id", deleteAbilityHistory);


// ─────────────────────────────────────────────
// 🎒 Global Storage (backpack page)
// ─────────────────────────────────────────────

router.get("/storage/all", getAllStorage);

router.post("/page/filter", filterCharactersPage);

// ─────────────────────────────────────────────
// 🎒 Per-character sub-resources
// ─────────────────────────────────────────────
router.get("/:id/light", getCharacterLightById);
router.get("/:id/tradables", getCharacterTradables);

router.post("/:id/storage", addToStorage);
router.get("/:id/storage", getStorage);
router.put("/:id/storage/use", useStoredAbility);
router.delete("/:id/storage/delete", deleteFromStorage);


// ─────────────────────────────────────────────
// Character CRUD (generic routes LAST)
// ─────────────────────────────────────────────

router.post("/", createCharacter);

// FULL characters (legacy / admin / edit pages)
router.get("/", getCharacters);

router.get("/:id", getCharacterById);
router.put("/:id", updateCharacter);
router.patch("/:id/abilities", updateCharacterAbilities);
router.delete("/:id", deleteCharacter);

router.post("/:id/compare-abilities", compareCharacterAbilities);


export default router;
