"use client";
import styles from "./styles.module.css";

export default function LevelPicker({ selectedLevel, setSelectedLevel }: any) {
  return (
    <div className={styles.column}>
      <h4>层级</h4>
      <div className={styles.levelCol}>
        {[9, 10].map((l) => (
          <button
            key={l}
            onClick={() => setSelectedLevel(l as 9 | 10)}
            className={`${styles.levelBtn} ${selectedLevel === l ? styles.active : ""}`}
          >
            {l}重
          </button>
        ))}
      </div>
    </div>
  );
}
