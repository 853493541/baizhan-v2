"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

/* ======================================================
   QA CHECK LOGIC (PURE)
====================================================== */
function checkGroupQA(
  group: GroupResult,
  conflictLevel: number,
  checkedAbilities: AbilityCheck[] = []
): string[] {
  const warnings: string[] = [];
  if (!group || !group.characters || group.characters.length === 0) {
    return warnings;
  }

  /* 🔹 Healer presence */
  if (!group.characters.some((c) => c.role === "Healer")) {
    warnings.push("缺少治疗");
  }

  /* 🔹 Duplicate accounts */
  const seen = new Set<string>();
  const dups = new Set<string>();

  for (const c of group.characters) {
    if (c.account) {
      if (seen.has(c.account)) dups.add(c.account);
      seen.add(c.account);
    }
  }

  if (dups.size > 0) {
    warnings.push(`重复账号: ${Array.from(dups).join("、")}`);
  }

  /* 🔹 Ability conflicts */
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

/* ======================================================
   TYPES
====================================================== */
interface Props {
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
  onClose: () => void;   // ✅ ADDED
}

/* ======================================================
   COMPONENT
====================================================== */
export default function GroupInfo({
  group,
  checkedAbilities,
  conflictLevel,
  onClose,
}: Props) {
  const qaWarnings = checkGroupQA(group, conflictLevel, checkedAbilities);

  return (
    <div className={styles.groupInfoRow}>
      {/* ⚠️ WARNINGS — LEFT */}
      <div className={styles.warningRow}>
        {qaWarnings.length > 0 ? (
          qaWarnings.map((v, idx) => (
            <span key={idx} className={styles.inlineWarn}>
              ⚠️ {v}
            </span>
          ))
        ) : (
          <span className={styles.inlineSafe}>✅ 无</span>
        )}
      </div>

      {/* 👥 MEMBERS — CENTER */}
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

      {/* ❌ CLOSE — RIGHT */}
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="关闭"
      >
        关闭
      </button>
    </div>
  );
}
