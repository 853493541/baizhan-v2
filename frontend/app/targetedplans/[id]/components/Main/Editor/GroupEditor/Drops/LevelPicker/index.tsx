"use client";
import { useEffect } from "react";
import styles from "./styles.module.css";

/* Match with AbilityList */
const COMMON_ABILITIES = [
  "流霞点绛",
  "霞袖回春",
  "云海听弦",
  "无我无剑式",
  "三环套月式",
  "月流斩",
  "退山凝",
  "电挈昆吾",
  "震岳势",
];

export default function LevelPicker({
  selectedAbility,
  selectedLevel,
  setSelectedLevel,
  disabled,
}: {
  selectedAbility?: string;
  selectedLevel: 9 | 10 | null;
  setSelectedLevel: (l: 9 | 10) => void;
  disabled?: boolean;
}) {
  /* ------------------------------------------------------------------
     🧩 Auto-select + hide logic for common abilities
  ------------------------------------------------------------------ */
  const isCommon = selectedAbility && COMMON_ABILITIES.includes(selectedAbility);

  useEffect(() => {
    if (isCommon) {
      setSelectedLevel(10); // ✅ auto-select 10重
    }
  }, [selectedAbility]);

  /* ------------------------------------------------------------------
     🧱 Render
  ------------------------------------------------------------------ */
  const levelsToShow = isCommon
    ? [{ value: 10, label: "十重" }] // 👈 hide 9重 if common
    : [
        { value: 9, label: "九重" },
        { value: 10, label: "十重" },
      ];

  return (
    <div className={styles.column}>
      <div className={styles.sectionDivider}>重数</div>

      <div className={styles.levelCol}>
        {levelsToShow.map((l) => (
          <button
            key={l.value}
            onClick={() => setSelectedLevel(l.value as 9 | 10)}
            className={`${styles.levelBtn} ${
              selectedLevel === l.value ? styles.active : ""
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
