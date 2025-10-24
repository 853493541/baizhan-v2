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

export default function AbilityChecking({ groups, characters, checkedAbilities }: Props) {
  const [groupAnalysis, setGroupAnalysis] = useState<Record<number, string[]>>({});
  const [checkLevel, setCheckLevel] = useState<9 | 10>(10);

  /* ----------------------------------------------------------------------
     🧠 Group drop compatibility check (Lv9 / Lv10 switchable)
     ✅ Shows ❌ with icon + name + level (九重/十重)
  ---------------------------------------------------------------------- */
  useEffect(() => {
    const relevantAbilities = checkedAbilities.filter(
      (a) => (a.level ?? 10) === checkLevel
    );

    const result: Record<number, string[]> = {};

    groups.forEach((g, i) => {
      const groupWarnings: string[] = [];

      if (!g.characters || g.characters.length === 0) {
        result[i] = ["✅ 全掉落兼容"];
        return;
      }

      for (const ab of relevantAbilities) {
        const requiredLv = ab.level ?? checkLevel;
        const allHave =
          g.characters.length > 0 &&
          g.characters.every(
            (c) =>
              typeof c.abilities === "object" &&
              !Array.isArray(c.abilities) &&
              (c.abilities?.[ab.name] ?? 0) >= requiredLv
          );

        if (allHave) {
          const levelLabel = requiredLv === 9 ? "九重" : "十重";
          groupWarnings.push(`${ab.name}|${levelLabel}`);
        }
      }

      if (groupWarnings.length === 0) {
        groupWarnings.push("✅ 无浪费");
      }

      result[i] = groupWarnings;
    });

    setGroupAnalysis(result);
  }, [groups, checkedAbilities, checkLevel]);

  /* ----------------------------------------------------------------------
     🖥️ Render
  ---------------------------------------------------------------------- */
  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h4 className={styles.title}>小组分析</h4>

        {/* Level toggle */}
        <div className={styles.levelTabs}>
          <button
            className={`${styles.tabBtn} ${checkLevel === 9 ? styles.active : ""}`}
            onClick={() => setCheckLevel(9)}
          >
            九重
          </button>
          <button
            className={`${styles.tabBtn} ${checkLevel === 10 ? styles.active : ""}`}
            onClick={() => setCheckLevel(10)}
          >
            十重
          </button>
        </div>
      </div>

      {groups.map((g, i) => (
        <div key={i} className={styles.groupBox}>
          <div className={styles.groupTitle}>小组 {i + 1}</div>

          {groupAnalysis[i]?.map((msg, idx) => {
            // ✅ Compatible
            if (msg.startsWith("✅")) {
              return (
                <div key={idx} className={styles.ok}>
                  ✅ 无浪费
                </div>
              );
            }

            // ❌ Warning
            const [name, levelLabel] = msg.split("|");
            const safeName = name.trim();

            return (
              <div key={idx} className={styles.warning}>
                <span className={styles.iconMark}>❌</span>
                <Image
                  src={`/icons/${safeName}.png`}
                  alt={safeName}
                  width={20}
                  height={20}
                  className={styles.abilityIcon}
                  unoptimized // 🟢 avoids Next.js encoding issues
                />
                <span className={styles.abilityText}>
                  {safeName} · {levelLabel}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
