import { Request, Response } from "express";
import Character from "../../models/Character";


export const getCharacters = async (req: Request, res: Response) => {
  try {
    const { owner, server, active } = req.query; // 🔹 optional filters
    const filter: any = {};

    if (owner) filter.owner = String(owner).trim();
    if (server) filter.server = String(server).trim();
    if (active !== undefined) filter.active = active === "true";

    const characters = await Character.find(filter);
    res.json(characters);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const getCharacterById = async (req: Request, res: Response) => {
  try {
    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });
    res.json(char);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
// ============================================================
// 🎒 Get all storage items across all characters
// GET /api/characters/storage/all
// ============================================================
export const getAllStorage = async (req: Request, res: Response) => {
  try {
    const characters = await Character.find({}, {
      name: 1,
      role: 1,
      storage: 1
    });

    // Flatten all storage entries into a single list
    const result = characters.flatMap((char) =>
      (char.storage || []).map((item: any) => ({
        characterId: char._id,
        characterName: char.name,
        role: char.role,
        ability: item.ability,
        level: item.level,
        used: item.used ?? false,
        receivedAt: item.receivedAt || new Date(0),
        sourceBoss: item.sourceBoss || null,
      }))
    );

    res.json(result);
  } catch (err: any) {
    console.error("❌ getAllStorage error:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    // Use .distinct() for fast unique list retrieval
    const accounts = await Character.distinct("account");

    return res.json(accounts);
  } catch (err: any) {
    console.error("❌ getAllAccounts error:", err);
    return res.status(500).json({ error: err.message });
  }
};