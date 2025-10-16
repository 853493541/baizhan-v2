"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

function checkGroupQA(
  group: GroupResult,
  conflictLevel: number,
  checkedAbilities: AbilityCheck[] = []
): string[] {
  const warnings: string[] = [];
  if (!group || !group.characters) return warnings;

  // 🔹 Check healer presence
  if (!group.characters.some((c) => c.role === "Healer")) {
    warnings.push("缺少治疗");
  }

  // 🔹 Check duplicate accounts
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of group.characters) {
    if (seen.has(c.account)) dups.add(c.account);
    seen.add(c.account);
  }
  if (dups.size > 0) {
    warnings.push(`重复账号: ${Array.from(dups).join("、")}`);
  }

  // 🔹 Check ability conflicts
  const activeAbilities = checkedAbilities.filter((a) => a.available);
  const abilityCount: Record<string, number> = {};
  for (const c of group.characters) {
    for (const a of activeAbilities) {
      const lvl = c.abilities?.[a.name] ?? 0;
      if (lvl >= conflictLevel) {
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
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
}

export default function GroupInfo({ group, checkedAbilities, conflictLevel }: Props) {
  const qaWarnings = checkGroupQA(group, conflictLevel, checkedAbilities);

  return (
    <div className={styles.groupInfoRow}>
      {/* ⚠️ Warnings on the left */}
      <div className={styles.warningRow}>
        {qaWarnings.length > 0 ? (
          qaWarnings.map((v, idx) => (
            <span key={idx} className={styles.inlineWarn}>
              ⚠️ {v}
            </span>
          ))
        ) : (
          <span className={styles.inlineSafe}>✅ 无警告</span>
        )}
      </div>

      {/* 👥 Characters centered on the same line */}
      <div className={styles.memberList}>
        {group.characters.map((c) => (
          <span
            key={c._id}
            className={`${styles.characterBox} ${
              c.role === "Tank"
                ? styles.tank
                : c.role === "Healer"
                ? styles.healer
                : styles.dps
            }`}
          >
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
