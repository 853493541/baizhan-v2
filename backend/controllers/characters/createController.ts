import { Request, Response } from "express";
import Character from "../../models/Character";
import Ability from "../../models/Ability";

/* ===============================
   🚻 Gender-locked abilities
================================= */
const MaleOnly = new Set([
  "巨猿劈山",
  "顽抗",
  "蛮熊碎颅击",
]);

const FemaleOnly = new Set([
  "剑心通明",
  "帝骖龙翔",
]);

export const createCharacter = async (req: Request, res: Response) => {
  try {
    const {
      name,
      account,
      server,
      gender,
      class: charClass,
      role,
      active,
      owner,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!account) return res.status(400).json({ error: "Account is required" });

    const allowedServers = ["梦江南", "乾坤一掷", "唯我独尊"];
    const allowedGenders = ["男", "女"];
    const allowedRoles = ["DPS", "Tank", "Healer"];
    const allowedClasses = [
      "七秀", "五毒", "万花", "天策", "明教", "纯阳", "少林", "长歌", "药宗",
      "蓬莱", "刀宗", "凌雪", "唐门", "藏剑", "丐帮", "霸刀", "衍天", "万灵", "段氏", "苍云",
    ];

    if (!allowedServers.includes(server))
      return res.status(400).json({ error: "Invalid server" });
    if (!allowedGenders.includes(gender))
      return res.status(400).json({ error: "Invalid gender" });
    if (!allowedRoles.includes(role))
      return res.status(400).json({ error: "Invalid role" });
    if (!allowedClasses.includes(charClass))
      return res.status(400).json({ error: "Invalid class" });

    const isActive = active === undefined ? true : Boolean(active);

    /* ===============================
       🧬 Initialize abilities (UPDATED)
    ================================= */
    const abilities = await Ability.find({});
    const abilityLevels: Record<string, number> = {};

    for (const a of abilities) {
      let level = 8; // default level

      // 🚻 Gender-locked abilities → set to 0 instead of removing
      if (gender === "男" && FemaleOnly.has(a.name)) level = 0;
      if (gender === "女" && MaleOnly.has(a.name)) level = 0;

      abilityLevels[a.name] = level;
    }

    const newCharacter = new Character({
      name: String(name).trim(),
      account: String(account).trim(),
      server,
      gender,
      class: charClass,
      role,
      active: isActive,
      abilities: abilityLevels,
      owner: owner ? String(owner).trim() : "Unknown",
    });

    await newCharacter.save();
    return res.status(201).json(newCharacter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
