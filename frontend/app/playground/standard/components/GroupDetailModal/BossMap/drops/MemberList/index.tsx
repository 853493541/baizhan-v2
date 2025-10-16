"use client";
import React from "react";
import styles from "./styles.module.css";
import { MAIN_CHARACTERS, getBossProgressText } from "../drophelpers";

export default function MemberList({
  group,
  chosenDrop,
  floor,
  dropList,
  onSave,
  onClose,
  groupStatus,
  onMarkStarted,
}: any) {
  const markStartedIfNeeded = () => {
    if (groupStatus === "not_started" && onMarkStarted) onMarkStarted();
  };

  // 🟦 Progress color
  const getProgressColor = (progress: string) => {
    if (progress.includes("十重") || progress.includes("全收集"))
      return styles.progressGreen;
    if (progress.includes("九重")) return styles.progressYellow;
    return styles.progressPink;
  };

  // 🧩 Helper: check backpack for 10重
  const hasLevel10InStorage = (character: any, ability: string): boolean => {
    const storage = character?.storage;
    if (!Array.isArray(storage)) return false;
    return storage.some(
      (item: any) =>
        item.ability === ability && item.level === 10 && item.used === false
    );
  };

  // 🧮 Helper: parse progress like "4/6 九重" => 4
  const parseProgress = (text: string): number => {
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  // 🆕 Helper: count how many level-10 abilities this character has from this boss
  const countLevel10FromBoss = (character: any, dropList: string[]): number => {
    if (!character?.abilities) return 0;
    return dropList.reduce((count, ab) => {
      const lv = character.abilities[ab] ?? 0;
      return lv >= 10 ? count + 1 : count;
    }, 0);
  };

  // 🟩 Determine best (single green) candidate
  const pickBestCharacter = (ability: string, level: number) => {
    const assignable = group.characters.filter((c: any) => {
      const lv = c.abilities?.[ability] ?? 0;
      return lv < level;
    });
    if (assignable.length === 0) return null;

    // 1️⃣ Main character among assignables
    const main = assignable.find((c: any) => MAIN_CHARACTERS.has(c.name));
    if (main) return main;

    // 2️⃣ Has 10重 in backpack (only applies when selected level = 9)
    let withStorage: any = null;
    if (level === 9) {
      withStorage = assignable.find((c: any) =>
        hasLevel10InStorage(c, ability)
      );
      if (withStorage) return withStorage;
    }

    // 3️⃣ Highest level among assignables (with tie-breaker)
    let best = assignable[0];
    let maxLv = best.abilities?.[ability] ?? 0;

    for (const c of assignable) {
      const lv = c.abilities?.[ability] ?? 0;

      // If strictly higher level → replace
      if (lv > maxLv) {
        best = c;
        maxLv = lv;
        continue;
      }

      // 4️⃣ If same level, compare progress (e.g., 4/6 > 2/6)
      if (lv === maxLv) {
        const progBest = parseProgress(getBossProgressText(dropList, best));
        const progCur = parseProgress(getBossProgressText(dropList, c));
        if (progCur > progBest) {
          best = c;
          maxLv = lv;
          continue;
        }

        // 5️⃣ If same progress, compare number of level-10s from this boss
        if (progCur === progBest) {
          const tenBest = countLevel10FromBoss(best, dropList);
          const tenCur = countLevel10FromBoss(c, dropList);
          if (tenCur > tenBest) {
            best = c;
            maxLv = lv;
          }
        }
      }
    }

    return best;
  };

  // 🟧 Assign selected drop
  const handleAssign = (charId: string) => {
    if (chosenDrop === "noDrop") {
      markStartedIfNeeded();
      onSave(floor, { noDrop: true });
      onClose();
      return;
    }
    if (chosenDrop) {
      markStartedIfNeeded();
      onSave(floor, {
        ability: chosenDrop.ability,
        level: chosenDrop.level,
        characterId: charId,
        noDrop: false,
      });
    }
  };

  // Precompute best match only once
  const bestCandidate =
    chosenDrop && chosenDrop !== "noDrop"
      ? pickBestCharacter(chosenDrop.ability, chosenDrop.level)
      : null;

  return (
    <div className={styles.rightColumn}>
      <div className={styles.sectionDivider}>角色</div>
      <div className={styles.memberGrid}>
        {group.characters.map((c: any) => {
          let levelDisplay: string | null = null;
          let disabled = !chosenDrop;

          if (chosenDrop && chosenDrop !== "noDrop") {
            const currentLevel = c.abilities?.[chosenDrop.ability] ?? 0;
            levelDisplay = `${currentLevel}重`;
            if (currentLevel >= chosenDrop.level) disabled = true;
          }

          const progressText = getBossProgressText(dropList, c);
          const progressColor = getProgressColor(progressText);

          // 🧩 Only check for backpack 10 when selected ability level = 9
          const hasStored10 =
            chosenDrop &&
            chosenDrop !== "noDrop" &&
            chosenDrop.level === 9 &&
            hasLevel10InStorage(c, chosenDrop.ability);

          // 🌈 Determine color (only one green per group)
          let colorClass = "";
          if (!disabled && chosenDrop && chosenDrop !== "noDrop") {
            if (bestCandidate && bestCandidate.name === c.name) {
              colorClass = styles.levelGreen;
            } else {
              colorClass = styles.levelYellow;
            }
          }

          return (
            <button
              key={c._id || c.id}
              className={`${styles.memberBtn} ${colorClass} ${
                disabled ? styles.memberDisabled : ""
              }`}
              onClick={() => !disabled && handleAssign(c._id || c.id)}
              disabled={disabled}
            >
              <div className={styles.nameRow}>
                {c.name}
                {levelDisplay && <span> ({levelDisplay})</span>}
              </div>
              <div className={styles.collectionRow}>
                <div className={`${styles.collectionStatus} ${progressColor}`}>
                  {progressText}
                </div>
                {hasStored10 && (
                  <div className={styles.storageTag}>包里有10</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
