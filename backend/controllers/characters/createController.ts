import { Request, Response } from "express";
import Character from "../../models/Character";
import Ability from "../../models/Ability";

export const createCharacter = async (req: Request, res: Response) => {
  try {
    const { name, account, server, gender, class: charClass, role, active, owner } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!account) return res.status(400).json({ error: "Account is required" });

    const allowedServers = ["梦江南", "乾坤一掷", "唯我独尊"];
    const allowedGenders = ["男", "女"];
    const allowedRoles = ["DPS", "Tank", "Healer"];
    const allowedClasses = [
      "七秀", "五毒", "万花", "天策", "明教", "纯阳", "少林", "长歌", "药宗",
      "蓬莱", "刀宗", "凌雪", "唐门", "藏剑", "丐帮", "霸刀", "衍天", "万灵", "段氏", "苍云"
    ];

    if (!allowedServers.includes(server)) return res.status(400).json({ error: "Invalid server" });
    if (!allowedGenders.includes(gender)) return res.status(400).json({ error: "Invalid gender" });
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
    if (!allowedClasses.includes(charClass)) return res.status(400).json({ error: "Invalid class" });

    const isActive = active === undefined ? true : Boolean(active);

    // Initialize abilities
    const abilities = await Ability.find({});
    const abilityLevels: Record<string, number> = {};
    abilities.forEach((a) => (abilityLevels[a.name] = 8));

    const newCharacter = new Character({
      name: String(name).trim(),
      account: String(account).trim(),
      server,
      gender,
      class: charClass,
      role,
      active: isActive,
      abilities: abilityLevels,
      owner: owner ? String(owner).trim() : "Unknown", // 🔹 NEW
    });

    await newCharacter.save();
    return res.status(201).json(newCharacter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
