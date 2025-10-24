"use client";

import React from "react";
import styles from "./styles.module.css";

export default function LevelPicker({
  selectedAbility,
  onSelectLevel,
  onBack,
}: {
  selectedAbility: string;
  onSelectLevel: (lvl: 9 | 10) => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.container}>
      <h3>选择层级 - {selectedAbility}</h3>
      <div className={styles.levelRow}>
        {[9, 10].map((l) => (
          <button
            key={l}
            onClick={() => onSelectLevel(l as 9 | 10)}
            className={styles.levelBtn}
          >
            {l}重
          </button>
        ))}
      </div>
      <button onClick={onBack} className={styles.backBtn}>
        返回
      </button>
    </div>
  );
}
