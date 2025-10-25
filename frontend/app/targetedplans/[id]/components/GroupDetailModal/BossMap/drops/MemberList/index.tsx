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

  const getProgressColor = (progress: string) => {
    if (progress.includes("十重") || progress.includes("全收集"))
      return styles.progressGreen;
    if (progress.includes("九重")) return styles.progressYellow;
    return styles.progressPink;
  };

  const hasLevel10InStorage = (character: any, ability: string): boolean => {
    const storage = character?.storage;
    if (!Array.isArray(storage)) return false;
    return storage.some(
      (item: any) =>
        item.ability === ability && item.level === 10 && item.used === false
    );
  };

  const parseProgress = (text: string): number => {
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const countLevel10FromBoss = (character: any, dropList: string[]): number => {
    if (!character?.abilities) return 0;
    return dropList.reduce((count, ab) => {
      const lv = character.abilities[ab] ?? 0;
      return lv >= 10 ? count + 1 : count;
    }, 0);
  };

  const pickBestCharacter = (ability: string, level: number) => {
    const assignable = group.characters.filter((c: any) => {
      const lv = c.abilities?.[ability] ?? 0;
      return lv < level;
    });
    if (assignable.length === 0) return null;

    const main = assignable.find((c: any) => MAIN_CHARACTERS.has(c.name));
    if (main) return main;

    let withStorage: any = null;
    if (level === 9) {
      withStorage = assignable.find((c: any) =>
        hasLevel10InStorage(c, ability)
      );
      if (withStorage) return withStorage;
    }

    let best = assignable[0];
    let maxLv = best.abilities?.[ability] ?? 0;

    for (const c of assignable) {
      const lv = c.abilities?.[ability] ?? 0;
      if (lv > maxLv) {
        best = c;
        maxLv = lv;
        continue;
      }

      if (lv === maxLv) {
        const progBest = parseProgress(getBossProgressText(dropList, best));
        const progCur = parseProgress(getBossProgressText(dropList, c));
        if (progCur > progBest) {
          best = c;
          maxLv = lv;
          continue;
        }

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

          const hasStored10 =
            chosenDrop &&
            chosenDrop !== "noDrop" &&
            chosenDrop.level === 9 &&
            hasLevel10InStorage(c, chosenDrop.ability);

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
              {/* === First Line: name + progress right-aligned === */}
              <div className={styles.topRow}>
                <span>
                  {c.name}
                  {levelDisplay && <span> ({levelDisplay})</span>}
                </span>
                <span className={`${styles.progressText} ${progressColor}`}>
                  {progressText}
                </span>
              </div>

              {/* === Second Line: warning if has stored 10 === */}
              {hasStored10 && (
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
