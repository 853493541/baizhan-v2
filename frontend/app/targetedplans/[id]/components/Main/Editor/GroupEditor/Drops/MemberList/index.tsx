"use client";

import React from "react";
import styles from "./styles.module.css";
import type { Character, GroupResult } from "@/utils/solver";

export default function MemberList({
  group,
  selectedAbility,
  selectedLevel,
  onSelectCharacter,
  onBack,
}: {
  group: GroupResult;
  selectedAbility: string;
  selectedLevel: 9 | 10;
  onSelectCharacter: (char: Character) => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.container}>
      <h3>选择角色 - {selectedAbility}（{selectedLevel}重）</h3>
      <div className={styles.memberGrid}>
        {group.characters.map((c) => {
          const level = c.abilities?.[selectedAbility] ?? 0;
          const disabled = level >= selectedLevel;

          return (
            <button
              key={c._id}
              disabled={disabled}
              className={`${styles.memberBtn} ${disabled ? styles.disabled : ""}`}
              onClick={() => onSelectCharacter(c)}
            >
              <span className={styles.name}>{c.name}</span>
              <span className={styles.level}>
                当前等级: {level > 0 ? `${level}重` : "未习得"}
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={onBack} className={styles.backBtn}>
        返回
      </button>
    </div>
  );
}
