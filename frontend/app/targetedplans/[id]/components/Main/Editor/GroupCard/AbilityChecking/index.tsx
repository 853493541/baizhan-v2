"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

interface Props {
  groups: GroupResult[];
  characters: Character[];
  checkedAbilities: AbilityCheck[];
}

/* ✅ Only these are considered when ability.level === 9 */
const LEVEL9_ONLY = [
  "坠龙惊鸿",
  "厄毒爆发",
  "陀罗曲静壁",
  "土崩炸弹",
  "飞云回转刀",
  "幽冥指",
  "短歌万劫",
  "泉映幻歌",
  "短歌一觞",
];

export default function AbilityChecking({ groups, characters, checkedAbilities }: Props) {
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const relevant = checkedAbilities.filter((a) => {
      const lv = a.level ?? 10;
      if (lv === 10) return true;
      if (lv === 9) return LEVEL9_ONLY.includes(a.name);
      return false;
    });

    const allWarnings: string[] = [];

    groups.forEach((g) => {
      if (!g.characters || g.characters.length < 2) return;

      // ① Ability overlap
      for (const ab of relevant) {
        const requiredLv = ab.level ?? 10;
        const allHave = g.characters.every(
          (c) =>
            typeof c.abilities === "object" &&
            (c.abilities?.[ab.name] ?? 0) >= requiredLv
        );
        if (allHave) {
          const icon = requiredLv === 9 ? "⚠️" : "❌";
          const label = requiredLv === 9 ? "九重" : "十重";
          allWarnings.push(`${icon}${ab.name}|${label}`);
        }
      }

      // ② Duplicate account
      const accounts = g.characters.map((c) => c.account || c.owner || "");
      const duplicates = accounts.filter(
        (acc, i) => acc && accounts.indexOf(acc) !== i
      );
      if (duplicates.length) {
        allWarnings.push(`❌同账号角色: ${[...new Set(duplicates)].join("、")}`);
      }

      // ③ Healer
      const hasHealer = g.characters.some(
        (c) => c.role?.toLowerCase?.() === "healer"
      );
      if (!hasHealer) allWarnings.push("❌无治疗角色");
    });

    if (allWarnings.length === 0) allWarnings.push("✅ 无浪费");

    // ✅ Sort: ❌ first, ⚠️ second, ✅ last
    const sorted = allWarnings.sort((a, b) => {
      const order = (s: string) =>
        s.startsWith("❌") ? 1 : s.startsWith("⚠️") ? 2 : 3;
      return order(a) - order(b);
    });

    setWarnings(sorted);
  }, [groups, checkedAbilities]);

  /* ----------------------------------------------------------------------
     🖥️ Render (single scrollable card)
  ---------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {warnings.map((msg, idx) => {
        if (msg.startsWith("✅"))
          return (
            <div key={idx} className={styles.ok}>
              ✅ 无浪费
            </div>
          );

        if (msg.startsWith("❌") && !msg.includes("|"))
          return (
            <div key={idx} className={styles.warning}>
              <span className={styles.iconMark}>❌</span>
              <span className={styles.abilityText}>{msg.replace("❌", "")}</span>
            </div>
          );

        if (msg.startsWith("⚠️") || msg.startsWith("❌")) {
          const icon = msg.startsWith("⚠️") ? "⚠️" : "❌";
          const [name, level] = msg.replace(icon, "").split("|");
          return (
            <div key={idx} className={styles.warning}>
              <span className={styles.iconMark}>{icon}</span>
              <Image
                src={`/icons/${name.trim()}.png`}
                alt={name.trim()}
                width={20}
                height={20}
                className={styles.abilityIcon}
                unoptimized
              />
              <span className={styles.abilityText}>
                {name.trim()} · {level}
              </span>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
