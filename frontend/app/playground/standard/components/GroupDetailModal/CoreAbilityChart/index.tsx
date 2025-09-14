"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

interface Props {
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
}

export default function CoreAbilityChart({ group, checkedAbilities, conflictLevel }: Props) {
  return (
    <>
      <h3>核心技能详情</h3>
      <table className={styles.abilityTable}>
        <thead>
          <tr>
            <th>技能</th>
            {group.characters.map((c) => (
              <th key={c._id}>{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checkedAbilities.map((a, idx) => (
            <tr key={idx}>
              <td>{a.name}</td>
              {group.characters.map((c) => {
                const lvl = c.abilities?.[a.name] ?? 0;
                const reached = lvl >= conflictLevel;
                return (
                  <td key={c._id} className={reached ? styles.reached : ""}>
                    {lvl > 0 ? `Lv${lvl}` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
