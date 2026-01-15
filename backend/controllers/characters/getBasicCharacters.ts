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
    const characters = await Character.find(
      {},
      "name account role server"   // ⭐ include server
    ).lean();

    const t1 = Date.now();
    console.log(`⚡ getBasicCharacters: ${characters.length} chars in ${t1 - t0}ms`);

    return res.json(characters);

  } catch (err: any) {
    console.error("❌ getBasicCharacters error:", err);
    return res.status(500).json({ error: err.message });
  }
};
export const getCharactersPageLightweight = async (
  req: Request,
  res: Response
) => {
  try {
    const { owner, server, active } = req.query;
    const filter: any = {};

    if (owner) filter.owner = String(owner).trim();
    if (server) filter.server = String(server).trim();
    if (active !== undefined) filter.active = active === "true";

    const t0 = Date.now();

    const characters = await Character.find(
      filter,
      { abilities: 0 }   // 🚫 exclude abilities ONLY
    ).lean();

    const t1 = Date.now();

    console.log(
      `⚡ getCharactersPageLightweight: ${characters.length} chars in ${t1 - t0}ms`
    );

    res.json(characters);
  } catch (err: any) {
    console.error("❌ getCharactersPageLightweight error:", err);
    res.status(500).json({ error: err.message });
  }
};