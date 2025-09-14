"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

// ✅ Inline QA checker (with null-safety)
function checkGroupQA(
  group?: GroupResult,
  conflictLevel?: number,
  checkedAbilities: AbilityCheck[] = []
): string[] {
  const warnings: string[] = [];
  if (!group || !group.characters) return warnings;

  // 1. Healer present?
  if (!group.characters.some((c) => c.role === "Healer")) {
    warnings.push("缺少治疗");
  }

  // 2. Duplicate accounts
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of group.characters) {
    if (seen.has(c.account)) dups.add(c.account);
    seen.add(c.account);
  }
  if (dups.size > 0) {
    warnings.push(`重复账号: ${Array.from(dups).join("、")}`);
  }

  // 3. Ability conflicts
  const activeAbilities = checkedAbilities.filter((a) => a.available);
  const abilityCount: Record<string, number> = {};
  for (const c of group.characters) {
    for (const a of activeAbilities) {
      const lvl = c.abilities?.[a.name] ?? 0;
      if (conflictLevel && lvl >= conflictLevel) {
        abilityCount[a.name] = (abilityCount[a.name] ?? 0) + 1;
      }
    }
  }

  for (const [ability, count] of Object.entries(abilityCount)) {
    if (count > 2) {
      warnings.push(`${ability} ${count}/2`);
    }
  }

  return warnings;
}

interface Props {
  group?: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
}

export default function BasicInfo({ group, checkedAbilities, conflictLevel }: Props) {
  if (!group) return null; // ✅ early return if group not loaded

  const qaWarnings = checkGroupQA(group, conflictLevel, checkedAbilities);

  return (
    <>
      <h3>成员</h3>
      <ul className={styles.memberList}>
        {group.characters.map((c) => (
          <li key={c._id}>{c.name}</li>
        ))}
      </ul>

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

      <h3>警告</h3>
      {qaWarnings.length > 0 ? (
        <ul className={styles.warnList}>
          {qaWarnings.map((v, idx) => (
            <li key={idx}>⚠️ {v}</li>
          ))}
        </ul>
      ) : (
        <p>✅ 无</p>
      )}
    </>
  );
}
