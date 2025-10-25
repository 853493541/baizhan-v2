"use client";
import styles from "./styles.module.css";
import SingleBossDrops from "@/app/data/Single_Boss_Drops.json";
import { MAIN_CHARACTERS, getBossProgressText } from "../drophelpers";

type Char = {
  _id: string;
  name: string;
  abilities: Record<string, number>;
  storage?: { ability: string; level: number; used?: boolean }[];
  gender?: "男" | "女";
};

export default function MemberList({
  group,
  allCharacters,
  selectedAbility,
  selectedLevel,
  selectedCharacter,
  setSelectedCharacter,
}: {
  group: { characters: Char[] };
  allCharacters: Char[];
  selectedAbility: string;
  selectedLevel: 9 | 10 | null;
  selectedCharacter: Char | null;
  setSelectedCharacter: (c: Char) => void;
}) {
  /* 🧩 Auto-detect which boss drop list includes the selected ability */
  const dropList =
    selectedAbility &&
    Object.entries(SingleBossDrops).find(([boss, list]) =>
      list.includes(selectedAbility)
    )?.[1] || [];

  /* Helper utilities */
  const fullChar = (c: Char) =>
    allCharacters.find((fc) => fc._id === c._id) || c;

  const hasLevel10InStorage = (ch: Char, ability: string) =>
    Array.isArray(ch?.storage) &&
    ch.storage.some(
      (it) => it.ability === ability && it.level === 10 && it.used === false
    );

  const getProgressColor = (txt: string) => {
    if (!txt) return "";
    if (txt.includes("十重") || txt.includes("全收集")) return styles.progressGreen;
    if (txt.includes("九重")) return styles.progressYellow;
    return styles.progressPink;
  };

  const parseProgress = (txt: string) => {
    const m = txt?.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? Number(m[1]) : 0;
  };

  const countLevel10FromBoss = (ch: Char, dl: string[]) =>
    dl.reduce((n, ab) => (ch.abilities?.[ab] >= 10 ? n + 1 : n), 0);

  /* 🧠 Auto pick best candidate for selected ability + level */
  const pickBestCandidate = (ability: string, level: 9 | 10 | null) => {
    if (!ability || !level) return null;
    const assignable = group.characters.filter(
      (c) => (c.abilities?.[ability] ?? 0) < level
    );
    if (assignable.length === 0) return null;

    // 1️⃣ Prefer main characters
    const main = assignable.find((c) => MAIN_CHARACTERS.has(c.name));
    if (main) return main;

    // 2️⃣ If assigning 九重, prefer someone who already holds a 10重 copy
    if (level === 9) {
      const withStored10 = assignable.find((c) =>
        hasLevel10InStorage(fullChar(c), ability)
      );
      if (withStored10) return withStored10;
    }

    // 3️⃣ Highest learned level wins → tie-break by boss progress and 10重 count
    let best = assignable[0];
    let bestLv = best.abilities?.[ability] ?? 0;

    for (const c of assignable.slice(1)) {
      const lv = c.abilities?.[ability] ?? 0;
      if (lv > bestLv) {
        best = c;
        bestLv = lv;
        continue;
      }
      if (lv === bestLv && dropList.length > 0) {
        const bpBest = getBossProgressText(dropList, fullChar(best));
        const bpCur = getBossProgressText(dropList, fullChar(c));
        const pBest = parseProgress(bpBest);
        const pCur = parseProgress(bpCur);
        if (pCur > pBest) {
          best = c;
          bestLv = lv;
          continue;
        }
        if (pCur === pBest) {
          const tBest = countLevel10FromBoss(fullChar(best), dropList);
          const tCur = countLevel10FromBoss(fullChar(c), dropList);
          if (tCur > tBest) best = c;
        }
      }
    }
    return best;
  };

  const bestCandidate = pickBestCandidate(selectedAbility, selectedLevel);

  return (
    <div className={styles.rightColumn}>
      <div className={styles.sectionDivider}>角色</div>

      <div className={styles.memberGrid}>
        {group.characters.map((c) => {
          const fc = fullChar(c);
          const learned = c.abilities?.[selectedAbility] ?? 0;
          const disabled =
            !selectedAbility || !selectedLevel || learned >= selectedLevel;
          const showStored10 =
            selectedLevel === 9 && hasLevel10InStorage(fc, selectedAbility);

          const progressText =
            dropList.length > 0 ? getBossProgressText(dropList, fc) : "";
          const progressColor = progressText ? getProgressColor(progressText) : "";

          let colorClass = "";
          if (!disabled && selectedAbility && selectedLevel) {
            colorClass =
              bestCandidate && bestCandidate._id === c._id
                ? styles.levelGreen
                : styles.levelYellow;
          }

          return (
            <button
              key={c._id}
              disabled={disabled}
              onClick={() => !disabled && setSelectedCharacter(c)}
              className={`${styles.memberBtn} ${colorClass} ${
                disabled ? styles.memberDisabled : ""
              } ${selectedCharacter?._id === c._id ? styles.active : ""}`}
            >
              <div className={styles.topRow}>
                <span className={styles.name}>
                  {c.name}（{learned > 0 ? learned : 0}）
                </span>
                {progressText && (
                  <span className={`${styles.progressText} ${progressColor}`}>
                    {progressText}
                  </span>
                )}
              </div>

              {showStored10 && (
                <div className={styles.warningRow}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span className={styles.warningText}>包里有10</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
