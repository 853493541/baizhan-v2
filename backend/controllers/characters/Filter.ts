import { Request, Response } from "express";
import Character from "../../models/Character";

/**
 * POST /api/characters/page/filter
 *
 * Full backend filtering for Character List Page.
 * - Basic filters: owner / server / role / active
 * - Ability filters: AND logic, exact level match
 * - Returns lightweight characters (NO abilities, NO storage)
 */
export const filterCharactersPage = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      owner,
      server,
      role,
      active,
      abilityFilters = [],
    } = req.body as {
      owner?: string;
      server?: string;
      role?: "DPS" | "Tank" | "Healer";
      active?: boolean;
      abilityFilters?: {
        ability: string;
        level: number;
      }[];
    };

    const t0 = Date.now();

    /* =========================
       1️⃣ Basic Mongo filters
       ========================= */
    const baseQuery: any = {};

    if (owner) baseQuery.owner = String(owner).trim();
    if (server) baseQuery.server = String(server).trim();
    if (role) baseQuery.role = role;
    if (typeof active === "boolean") baseQuery.active = active;

    /* =========================
       2️⃣ Fetch candidates
       - abilities ONLY for filtering
       - minimal list-page fields
       ========================= */
    const candidates = await Character.find(
      baseQuery,
      {
        abilities: 1,   // TEMP: only for filtering
        name: 1,
        account: 1,
        owner: 1,
        server: 1,
        class: 1,
        role: 1,
        active: 1,
      }
    ).lean();

    /* =========================
       3️⃣ Ability AND-filter
       ========================= */
    const matched =
      abilityFilters.length === 0
        ? candidates
        : candidates.filter((char) =>
            abilityFilters.every((f) => {
              const lvl = char.abilities?.[f.ability] ?? 0;
              return lvl === f.level;
            })
          );

    /* =========================
       4️⃣ Strip abilities
       ========================= */
    const result = matched.map(({ abilities, ...rest }) => rest);

    const t1 = Date.now();

    console.log(
      `⚡ filterCharactersPage: ${result.length}/${candidates.length} chars in ${t1 - t0}ms`
    );

    return res.json(result);
  } catch (err: any) {
    console.error("❌ filterCharactersPage error:", err);
    return res.status(500).json({ error: err.message });
  }
};
