"use client";
import styles from "./styles.module.css";

export default function LevelPicker({
  selectedLevel,
  setSelectedLevel,
  disabled,
}: {
  selectedLevel: 9 | 10 | null;
  setSelectedLevel: (l: 9 | 10) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.column}>
      <div className={styles.sectionDivider}>重数</div>

      <div className={styles.levelCol}>
        {[
          { value: 9, label: "九重" },
          { value: 10, label: "十重" },
        ].map((l) => (
          <button
            key={l.value}
            onClick={() => !disabled && setSelectedLevel(l.value as 9 | 10)}
            disabled={disabled}
            className={`${styles.levelBtn} ${
              selectedLevel === l.value ? styles.active : ""
            } ${disabled ? styles.disabled : ""}`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
