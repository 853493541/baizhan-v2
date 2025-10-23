"use client";

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

  useEffect(() => {
    console.log("🧩 [AbilityChecking] Checked Abilities:", checkedAbilities);
  }, [checkedAbilities]);

  /* ----------------------------------------------------------------------
     🧠 Group drop compatibility check
     For each group, test if *all characters* have the ability at Lv10.
     If yes → "掉落浪费：xxx"
     If not → "全掉落兼容"
     🟢 Includes empty-group fix (.every() returns true on empty array)
  ---------------------------------------------------------------------- */
  useEffect(() => {
    const result: Record<number, string[]> = {};

    groups.forEach((g, i) => {
      const groupWarnings: string[] = [];

      // 🟢 Skip empty groups
      if (!g.characters || g.characters.length === 0) {
        result[i] = ["✅ 全掉落兼容"];
        return;
      }

      for (const ab of checkedAbilities) {
        const allHave =
          g.characters.length > 0 &&
          g.characters.every((c) => (c.abilities?.[ab.name] ?? 0) >= ab.level);

        if (allHave) {
          groupWarnings.push(`⚠️ 掉落浪费：${ab.name}`);
        }
      }

      if (groupWarnings.length === 0) {
        groupWarnings.push("✅ 全掉落兼容");
      }

      result[i] = groupWarnings;
    });

    setGroupAnalysis(result);
  }, [groups, checkedAbilities]);

  /* ----------------------------------------------------------------------
     🖥️ Render
  ---------------------------------------------------------------------- */
  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>🧠 掉落兼容检查</h4>

      {groups.map((g, i) => (
        <div key={i} className={styles.groupBox}>
          <div className={styles.groupTitle}>小组 {i + 1}</div>
          {groupAnalysis[i]?.map((msg, idx) => (
            <div
              key={idx}
              className={msg.includes("兼容") ? styles.ok : styles.warning}
            >
              {msg}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
