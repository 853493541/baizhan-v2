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
const history_1 = require("../controllers/characters/history"); // ✅ history controller
const compareController_1 = require("../controllers/characters/compareController");
const router = express_1.default.Router();
// ─────────────────────────────────────────────
// Character CRUD
// ─────────────────────────────────────────────
router.get("/accounts", getController_1.getAllAccounts);
router.post("/", createController_1.createCharacter);
router.get("/", getController_1.getCharacters);
router.get("/:id", getController_1.getCharacterById);
router.patch("/:id/abilities", updateController_1.updateCharacterAbilities);
router.put("/:id", updateController_1.updateCharacter);
router.delete("/:id", updateController_1.deleteCharacter);
router.post("/:id/compare-abilities", compareController_1.compareCharacterAbilities);
// ─────────────────────────────────────────────
// 🧾 Ability History
// ─────────────────────────────────────────────
// ⚠️ More specific routes first
router.get("/abilities/history", history_1.getAbilityHistory); // 获取技能历史
router.get("/abilities/history/latest/:characterId", history_1.getLatestAbilityUpdate); // ✅ 最新更新记录
router.post("/abilities/history/batch/revert", history_1.revertMultipleHistory); // ✅ 批量撤回
router.post("/abilities/history/:id/revert", history_1.revertAbilityHistory); // 单条撤回
router.delete("/abilities/history/:id", history_1.deleteAbilityHistory); // 删除历史记录
// ─────────────────────────────────────────────
// 🎒 Storage System (per-character endpoints)
// ─────────────────────────────────────────────
// POST /api/characters/:id/storage → add ability to storage
router.post("/:id/storage", updateController_1.addToStorage);
// GET /api/characters/:id/storage → get stored abilities
router.get("/:id/storage", updateController_1.getStorage);
// PUT /api/characters/:id/storage/use → use a stored ability
router.put("/:id/storage/use", updateController_1.useStoredAbility);
// DELETE /api/characters/:id/storage/delete → remove a stored ability
router.delete("/:id/storage/delete", updateController_1.deleteFromStorage);
// ─────────────────────────────────────────────
// 🎒 Global Storage Endpoint (Backpack Page)
// ─────────────────────────────────────────────
// ⚠️ Must be declared *after* per-character routes, but *before* /:id
router.get("/storage/all", getController_1.getAllStorage);
exports.default = router;
