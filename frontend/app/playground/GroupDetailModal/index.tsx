"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

interface Props {
  groupIndex: number;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
  onClose: () => void;
}

export default function GroupDetailModal({
  groupIndex,
  group,
  checkedAbilities,
  conflictLevel,
  onClose,
}: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <h2>分组详情 - Group {groupIndex + 1}</h2>

        <h3>成员 ({group.characters.length})</h3>
        <ul className={styles.memberList}>
          {group.characters.map((c) => (
            <li key={c._id}>{c.name}</li>
          ))}
        </ul>

        <h3>核心技能详情 (Lv{conflictLevel}+)</h3>
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
                    <td
                      key={c._id}
                      className={reached ? styles.reached : ""}
                    >
                      {lvl > 0 ? `Lv${lvl}` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <h3>违规/警告</h3>
        {group.violations.length > 0 ? (
          <ul className={styles.warnList}>
            {group.violations.map((v, idx) => (
              <li key={idx}>⚠️ {v}</li>
            ))}
          </ul>
        ) : (
          <p>✅ 无</p>
        )}
      </div>
    </div>
  );
}
