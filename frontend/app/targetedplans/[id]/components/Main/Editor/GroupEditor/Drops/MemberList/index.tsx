"use client";
import styles from "./styles.module.css";

export default function MemberList({
  group,
  allCharacters,
  selectedAbility,
  selectedLevel,
  selectedCharacter,
  setSelectedCharacter,
}: any) {
  return (
    <div className={styles.rightColumn}>
      <h4>角色</h4>

      <div className={styles.list}>
        {group.characters.map((c: any) => {
          const fullChar = allCharacters.find((fc: any) => fc._id === c._id);
          const learned = c.abilities?.[selectedAbility] ?? 0;

          // 🧩 Disable if: no level selected OR character already has that level or higher
          const disabled = !selectedLevel || learned >= selectedLevel;

          return (
            <button
              key={c._id}
              disabled={disabled}
              onClick={() => !disabled && setSelectedCharacter(c)}
              className={`${styles.memberBtn} ${
                selectedCharacter?._id === c._id ? styles.active : ""
              } ${disabled ? styles.disabled : ""}`}
            >
              <span className={styles.name}>{c.name}</span>
              <span className={styles.level}>
                {learned > 0 ? `当前：${learned}重` : "未习得"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
