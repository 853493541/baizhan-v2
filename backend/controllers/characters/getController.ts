import { Request, Response } from "express";
import Character from "../../models/Character";

export const getCharacters = async (req: Request, res: Response) => {
  try {
    const { owner } = req.query; // 🔹 optional filter
    const filter: any = {};

    if (owner) {
      filter.owner = String(owner).trim();
    }

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
