import { Request, Response } from "express";
import Character from "../../models/Character";

export const compareCharacterAbilities = async (req: Request, res: Response) => {
  try {
    const { abilities } = req.body;
    if (!abilities || typeof abilities !== "object") {
      return res.status(400).json({ error: "abilities object is required" });
    }

    const char = await Character.findById(req.params.id);
    if (!char) return res.status(404).json({ error: "Character not found" });

    const abilityAliases: Record<string, string> = {
      "电昆吾": "电挈昆吾",
      "蛇召唤": "蝮蛇召唤",
      "枪法蛇": "枪法蝮蛇",
      "武倪召来": "武傀召来",
      "尸鬼封": "尸鬼封烬",
      "帝龙翔": "帝骖龙翔",
    };

    const femaleOnlyBan = new Set(["顽抗", "巨猿劈山", "蛮熊碎颅击"]);
    const maleOnlyBan = new Set(["剑心通明", "帝骖龙翔"]);
    const ignoreAlways = new Set([
      "退山凝", "电挈昆吾", "立剑势", "震岳势", "流霞点绛", "霞袖回春",
      "云海听弦", "玉魄惊鸾", "无我无剑式", "月流斩", "三环套月式", "剑飞惊天",
    ]);

    const toUpdate: Array<{ name: string; old: number; new: number }> = [];
    const unchanged: Array<{ name: string; value: number }> = [];
    const ocrOnly: string[] = [];

    for (const [rawName, level] of Object.entries(abilities)) {
      const name = abilityAliases[rawName] || rawName;
      const hasKey =
        (char.abilities as any)?.has?.(name) ||
        Object.prototype.hasOwnProperty.call(char.abilities || {}, name);

      if (hasKey) {
        const oldVal =
          (char.abilities as any)?.get?.(name) ??
          (char.abilities as any)?.[name] ??
          0;

        if (Number(oldVal) !== Number(level)) {
          toUpdate.push({ name, old: Number(oldVal), new: Number(level) });
        } else {
          unchanged.push({ name, value: Number(level) });
        }
      } else {
        ocrOnly.push(rawName);
      }
    }

    let abilityObj: Record<string, number> = {};
    if (char.abilities instanceof Map) {
      abilityObj = Object.fromEntries(char.abilities);
    } else if (typeof (char.abilities as any).toObject === "function") {
      abilityObj = (char.abilities as any).toObject();
    } else {
      abilityObj = char.abilities as Record<string, number>;
    }

    const normalizedOCRNames = new Set(
      Object.keys(abilities).map((raw) => abilityAliases[raw] || raw)
    );

    const dbOnly: string[] = [];
    for (const name of Object.keys(abilityObj)) {
      if (char.gender === "女" && femaleOnlyBan.has(name)) continue;
      if (char.gender === "男" && maleOnlyBan.has(name)) continue;
      if (ignoreAlways.has(name)) continue;
      if (!normalizedOCRNames.has(name)) dbOnly.push(name);
    }

    const filteredOcrOnly = ocrOnly.filter((rawName) => {
      const normalized = abilityAliases[rawName] || rawName;
      if (char.gender === "女" && femaleOnlyBan.has(normalized)) return false;
      if (char.gender === "男" && maleOnlyBan.has(normalized)) return false;
      if (ignoreAlways.has(normalized)) return false;
      return true;
    });

    return res.json({ toUpdate, unchanged, ocrOnly: filteredOcrOnly, dbOnly });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
