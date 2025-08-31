import { Router } from "express";
import multer from "multer";
import {
  createCharacter,
  getCharacters,
  getCharacterById,
  updateCharacterAbilities,
  updateCharacter,      // general info update
  deleteCharacter,
  healthCheck,
  compareCharacterAbilities,
} from "../controllers/characterController";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/health/check", healthCheck);
router.post("/:id/compareAbilities", compareCharacterAbilities);

router.post("/", createCharacter);
router.get("/", getCharacters);
router.get("/:id", getCharacterById);

// split updates for clarity
router.put("/:id/abilities", updateCharacterAbilities);
router.put("/:id/info", updateCharacter);

router.delete("/:id", deleteCharacter);

export default router;
