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
     🧠 Group analysis: ability overlap + duplicate accounts + healer presence
  ---------------------------------------------------------------------- */
  useEffect(() => {
    const relevantAbilities = checkedAbilities.filter(
      (a) => (a.level ?? 10) === checkLevel
    );

    const result: Record<number, string[]> = {};

    groups.forEach((g, i) => {
      if (!g.characters || g.characters.length < 2) {
        result[i] = [];
        return;
      }

      const groupWarnings: string[] = [];

      /* === ① Ability overlap === */
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

      /* === ② Duplicate account check === */
      const accounts = g.characters.map((c) => c.account || c.owner || "");
      const duplicates = accounts.filter(
        (acc, idx) => acc && accounts.indexOf(acc) !== idx
      );
      if (duplicates.length > 0) {
        const unique = Array.from(new Set(duplicates));
        groupWarnings.push(`⚠️ 同账号角色: ${unique.join("、")}`);
      }

      /* === ③ Healer presence check === */
      const hasHealer = g.characters.some(
        (c) => c.role?.toLowerCase?.() === "healer"
      );
      if (!hasHealer) {
        groupWarnings.push("⚠️ 无治疗角色");
      }

      /* === ④ If no issues === */
      if (groupWarnings.length === 0) groupWarnings.push("✅ 无浪费");

      result[i] = groupWarnings;
    });

    setGroupAnalysis(result);
  }, [groups, checkedAbilities, checkLevel]);

  /* ----------------------------------------------------------------------
     🖥️ Render
  ---------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Header bar */}
      <div className={styles.headerBar}>
        <h3 className={styles.headerTitle}>小组分析</h3>
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

      {/* Card list */}
      <div className={styles.cardsArea}>
        {groups.map((g, i) => {
          if (!g.characters || g.characters.length < 2) return null;

          return (
            <div key={i} className={styles.groupBox}>
              <div className={styles.groupTitle}>小组 {i + 1}</div>

              {groupAnalysis[i]?.map((msg, idx) => {
                if (msg.startsWith("✅")) {
                  return (
                    <div key={idx} className={styles.ok}>
                      ✅ 无浪费
                    </div>
                  );
                }

                // Show special warnings (non-ability)
                if (msg.startsWith("⚠️")) {
                  return (
                    <div key={idx} className={styles.warning}>
                      <span className={styles.iconMark}>⚠️</span>
                      <span className={styles.abilityText}>{msg.replace("⚠️ ", "")}</span>
                    </div>
                  );
                }

                // Ability overlaps (❌)
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
                      unoptimized
                    />
                    <span className={styles.abilityText}>
                      {safeName} · {levelLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
