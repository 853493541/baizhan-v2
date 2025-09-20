"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const createController_1 = require("../controllers/characters/createController");
const getController_1 = require("../controllers/characters/getController");
const updateController_1 = require("../controllers/characters/updateController");
const compareController_1 = require("../controllers/characters/compareController");
const router = express_1.default.Router();
router.post("/", createController_1.createCharacter);
router.get("/", getController_1.getCharacters);
router.get("/:id", getController_1.getCharacterById);
router.patch("/:id/abilities", updateController_1.updateCharacterAbilities);
router.put("/:id", updateController_1.updateCharacter);
router.delete("/:id", updateController_1.deleteCharacter);
router.post("/:id/compare-abilities", compareController_1.compareCharacterAbilities);
exports.default = router;
