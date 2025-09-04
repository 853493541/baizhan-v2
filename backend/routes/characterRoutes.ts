import express from "express";
import { createCharacter } from "../controllers/characters/createController";
import { getCharacters, getCharacterById } from "../controllers/characters/getController";
import { updateCharacter, updateCharacterAbilities, deleteCharacter } from "../controllers/characters/updateController";
import { compareCharacterAbilities } from "../controllers/characters/compareController";

const router = express.Router();

router.post("/", createCharacter);
router.get("/", getCharacters);
router.get("/:id", getCharacterById);
router.patch("/:id/abilities", updateCharacterAbilities);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);
router.post("/:id/compare-abilities", compareCharacterAbilities);

export default router;
