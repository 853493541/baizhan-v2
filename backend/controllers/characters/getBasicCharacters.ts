import { Request, Response } from "express";
import Character from "../../models/Character";

/**
 * Ultra-fast endpoint for schedule & UI modals.
 * Returns only minimal fields for performance.
 */
export const getBasicCharacters = async (req: Request, res: Response) => {
  try {
    const t0 = Date.now();

    // ⚡ Only fetch minimal fields needed by UI
    const characters = await Character.find({}, "name account role")
      .lean();

    const t1 = Date.now();
    console.log(`⚡ getBasicCharacters: ${characters.length} chars in ${t1 - t0}ms`);

    return res.json(characters);
  } catch (err: any) {
    console.error("❌ getBasicCharacters error:", err);
    return res.status(500).json({ error: err.message });
  }
};
