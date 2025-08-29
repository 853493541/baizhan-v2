// backend/routes/characterRoutes.ts
import { Router } from "express";
import multer from "multer";

import {
  createCharacter,
  getCharacters,
  getCharacterById,
  updateCharacterAbilities,
  deleteCharacter,
  healthCheck,
  compareCharacterAbilities,
} from "../controllers/characterController";

const router = Router();
const upload = multer({ dest: "uploads/" }); // still here in case you need it later

// ============================
// Health check
// ============================
router.get("/health/check", healthCheck);

// ============================
// Compare OCR abilities with stored data
// ============================
router.post("/:id/compareAbilities", compareCharacterAbilities);

// ============================
// Create new character
// ============================
router.post("/", createCharacter);

// ============================
// Get all characters
// ============================
router.get("/", getCharacters);

// ============================
// Get one character by ID
// ============================
router.get("/:id", getCharacterById);

// ============================
// Update character abilities (partial merge)
// ============================
router.put("/:id", updateCharacterAbilities);

// ============================
// Delete character
// ============================
router.delete("/:id", deleteCharacter);

export default router;
