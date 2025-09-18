import { Request, Response } from "express";
import Character from "../../models/Character";

// Get all unique catalogs across characters
export const getAllCatalogs = async (req: Request, res: Response) => {
  try {
    const catalogs = await Character.distinct("catalog");
    res.json(catalogs.filter(Boolean)); // remove empty/null
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
