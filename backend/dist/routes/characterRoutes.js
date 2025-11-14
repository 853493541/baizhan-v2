"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────
const createController_1 = require("../controllers/characters/createController");
const getController_1 = require("../controllers/characters/getController");
const updateController_1 = require("../controllers/characters/updateController");
const history_1 = require("../controllers/characters/history");
const compareController_1 = require("../controllers/characters/compareController");
// ⭐ NEW ultra-fast controller
const getBasicCharacters_1 = require("../controllers/characters/getBasicCharacters");
const router = express_1.default.Router();
// ─────────────────────────────────────────────
// ⚡ NEW Ultra-light Characters Endpoint
// MUST come BEFORE "/:id" or it'll conflict
// ─────────────────────────────────────────────
router.get("/basic", getBasicCharacters_1.getBasicCharacters);
// ─────────────────────────────────────────────
// Character Metadata
// ─────────────────────────────────────────────
router.get("/accounts", getController_1.getAllAccounts);
// ─────────────────────────────────────────────
// Character CRUD
// ─────────────────────────────────────────────
router.post("/", createController_1.createCharacter);
router.get("/", getController_1.getCharacters); // full characters
router.get("/:id", getController_1.getCharacterById);
router.patch("/:id/abilities", updateController_1.updateCharacterAbilities);
router.put("/:id", updateController_1.updateCharacter);
router.delete("/:id", updateController_1.deleteCharacter);
router.post("/:id/compare-abilities", compareController_1.compareCharacterAbilities);
// ─────────────────────────────────────────────
// 🧾 Ability History
// ⚠️ Specific routes first
// ─────────────────────────────────────────────
router.get("/abilities/history", history_1.getAbilityHistory);
router.get("/abilities/history/latest/:characterId", history_1.getLatestAbilityUpdate);
router.post("/abilities/history/batch/revert", history_1.revertMultipleHistory);
router.post("/abilities/history/:id/revert", history_1.revertAbilityHistory);
router.delete("/abilities/history/:id", history_1.deleteAbilityHistory);
// ─────────────────────────────────────────────
// 🎒 Storage System (per-character)
// ─────────────────────────────────────────────
router.post("/:id/storage", updateController_1.addToStorage);
router.get("/:id/storage", updateController_1.getStorage);
router.put("/:id/storage/use", updateController_1.useStoredAbility);
router.delete("/:id/storage/delete", updateController_1.deleteFromStorage);
// ─────────────────────────────────────────────
// 🎒 Global Storage (backpack page)
// ─────────────────────────────────────────────
router.get("/storage/all", getController_1.getAllStorage);
exports.default = router;
