// backend/controllers/characterPageController.ts

import { Request, Response } from "express";
import Character from "../../models/Character";
import { getTradables } from "../../utils/tradables";
import {
  createPinyinMap,
  pinyinFilter,
} from "../../utils/pinyinSearch";

/**
 * POST /api/characters/page/filter
 *
 * Backend filtering for Character List Page.
 *
 * Supported filters:
 * - owner / server / role / active
 * - abilityFilters (AND logic, exact level match)
 * - name search (Chinese / full pinyin / initials)
 * - tradable: 紫书可读（getTradables().length > 0）
 *
 * Returns:
 * - lightweight characters
 *   (NO abilities, NO storage, NO gender)
 * - includes derived field: hasActions
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
      name,
      tradable,
      abilityFilters = [],
    } = req.body as {
      owner?: string;
      server?: string;
      role?: "DPS" | "Tank" | "Healer";
      active?: boolean;
      name?: string;
      tradable?: boolean;
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

    // default active = true
    const normalizedActive =
      typeof active === "boolean" ? active : true;

    baseQuery.active = normalizedActive;

    /* =========================
       2️⃣ Fetch candidates
       - abilities & gender needed
       ========================= */
    const candidates = await Character.find(
      baseQuery,
      {
        abilities: 1,
        gender: 1,
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
    const abilityMatched =
      abilityFilters.length === 0
        ? candidates
        : candidates.filter((char) =>
            abilityFilters.every((f) => {
              const lvl = char.abilities?.[f.ability] ?? 0;
              return lvl === f.level;
            })
          );

    /* =========================
       4️⃣ Name / Pinyin filter
       ========================= */
    let nameMatched = abilityMatched;

    if (name && name.trim()) {
      const names = abilityMatched
        .map((c) => c.name)
        .filter(Boolean) as string[];

      const pinyinMap = await createPinyinMap(names);
      const matchedNames = new Set(
        pinyinFilter(names, pinyinMap, name)
      );

      nameMatched = abilityMatched.filter((c) =>
        matchedNames.has(c.name)
      );
    }

    /* =========================
       5️⃣ Compute tradable summary
       ========================= */
    const withTradableInfo = nameMatched.map((char) => {
      const tradables = getTradables({
        abilities: char.abilities,
        gender: char.gender,
      });

      return {
        ...char,
        hasActions: tradables.length > 0,
      };
    });

    /* =========================
       6️⃣ Apply tradable filter
       ========================= */
    const tradableMatched = tradable
      ? withTradableInfo.filter((c) => c.hasActions)
      : withTradableInfo;

    /* =========================
       7️⃣ Strip internal fields
       ========================= */
    const result = tradableMatched.map(
      ({ abilities, gender, ...rest }) => rest
    );

    const t1 = Date.now();

    console.log(
      `⚡ filterCharactersPage: ${result.length}/${candidates.length} chars in ${t1 - t0}ms (active=${normalizedActive})`
    );

    return res.json(result);
  } catch (err: any) {
    console.error("❌ filterCharactersPage error:", err);
    return res.status(500).json({ error: err.message });
  }
};
