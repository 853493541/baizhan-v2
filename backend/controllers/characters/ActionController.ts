// backend/controllers/characterActionController.ts

import { Request, Response } from "express";
import { getTradables } from "../../utils/tradables";
import CharacterModel from "../../models/Character"; // adjust if using mongoose

export async function getCharacterTradables(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const character = await CharacterModel.findById(id).lean();
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    const tradables = getTradables({
      abilities: character.abilities ?? {},
      gender: character.gender,
    });

    return res.json({
      hasActions: tradables.length > 0,
      tradables,
    });
  } catch (err) {
    console.error("❌ getCharacterTradables error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
