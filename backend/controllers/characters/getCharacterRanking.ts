import { Request, Response } from "express";
import Character from "../../models/Character";

// =====================================================
// ✅ Lightweight character ranking fetch
// =====================================================
export const getCharacterRanking = async (req: Request, res: Response) => {
  try {
    const characters = await Character.find(
      {},
      {
        _id: 0,
        characterId: 1,
        name: 1,
        role: 1,
        server: 1,
        active: 1,
        energy: 1,       // ✅ ADD
        durability: 1,   // ✅ KEEP
        class:1,
        owner: 1,
      }
    )
      .lean()
      .sort({ durability: -1 }); // sorting here is fine; frontend re-sorts by sum

    res.json(characters);
  } catch (err) {
    console.error("[getCharacterRanking] ❌", err);
    res.status(500).json({ error: "Failed to fetch character ranking" });
  }
};
