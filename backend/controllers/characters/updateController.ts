import { Request, Response } from "express";
import Character from "../../models/Character";

export const updateCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body;
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const setOps: Record<string, number> = {};
    const updated: Array<{ name: string; old: number; new: number }> = [];

    for (const [name, level] of Object.entries(abilities)) {
      const oldVal =
        (char.abilities as any)?.get?.(name) ??
        (char.abilities as any)?.[name] ??
        0;

      setOps[`abilities.${name}`] = Number(level);
      updated.push({ name, old: Number(oldVal), new: Number(level) });
    }

    if (Object.keys(setOps).length === 0) {
      return res.status(400).json({ error: "No abilities provided" });
    }

    const newDoc = await Character.findByIdAndUpdate(
      req.params.id,
      { $set: setOps },
      { new: true }
    );

    return res.json({ character: newDoc, updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateCharacter = async (req: Request, res: Response) => {
  try {
    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const {
      account,
      server,
      gender,
      class: charClass,
      role,
      active,
      name,
      owner,
      catalog,
      mainCharacter,
    } = req.body;

    if (name !== undefined) char.name = String(name).trim();
    if (account !== undefined) char.account = String(account).trim();
    if (server !== undefined) char.server = server;
    if (gender !== undefined) char.gender = gender;
    if (role !== undefined) char.role = role;
    if (charClass !== undefined) char.class = String(charClass).trim();
    if (active !== undefined) char.active = Boolean(active);
    if (owner !== undefined) char.owner = String(owner).trim();

    // 🔹 Handle catalog (replace OR append)
    if (catalog !== undefined) {
      if (Array.isArray(catalog)) {
        // full replace
        char.catalog = catalog.map((c) => String(c).trim());
      } else if (typeof catalog === "string") {
        // append mode
        const newCatalog = String(catalog).trim();
        if (newCatalog && !char.catalog.includes(newCatalog)) {
          char.catalog.push(newCatalog);
        }
      }
    }

    // 🔹 Handle mainCharacter
    if (mainCharacter !== undefined) {
      char.mainCharacter = Boolean(mainCharacter);
    }

    await char.save();
    res.json(char);
  } catch (err: any) {
    if (err?.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    }
    return res.status(500).json({ error: err.message });
  }
};

export const deleteCharacter = async (req: Request, res: Response) => {
  try {
    const deleted = await Character.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Character not found" });
    res.json({ message: "Character deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
