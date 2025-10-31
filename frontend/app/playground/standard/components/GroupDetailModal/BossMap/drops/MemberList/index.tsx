"use client";
import React from "react";
import styles from "./styles.module.css";
import { getAbilityIcon, getBossProgressText } from "../drophelpers";
import { pickBestCharacterWithTrace } from "./RecommandWindow/recommendation";

/** 🔄 Gender-based transferable skill rules */
function getTransferableAbility(
  pickedAbility: string,
  gender: string | undefined
): string | null {
  // 双向可转换
  if (pickedAbility === "剑心通明" && gender === "男") return "巨猿劈山";
  if (pickedAbility === "巨猿劈山" && gender === "女") return "剑心通明";

  // 单向：female receiving male skill
  if (pickedAbility === "蛮熊碎颅击" && gender === "女") return "水遁水流闪";

  return null;
}

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

  /** 🧩 Assign drop, with real transfer substitution */
  const handleAssign = (charId: string) => {
    if (chosenDrop === "noDrop") {
      markStartedIfNeeded();
      onSave(floor, { noDrop: true });
      onClose();
      return;
    }

    if (chosenDrop) {
      const char = group.characters.find(
        (ch: any) => ch._id === charId || ch.id === charId
      );

      let finalAbility = chosenDrop.ability;

      // 🔄 Check if transferable
      const transferable = getTransferableAbility(finalAbility, char?.gender);
      if (transferable) {
        const transferLevel = char?.abilities?.[transferable] ?? 0;
        const pickedLevel = char?.abilities?.[finalAbility] ?? 0;

        // ✅ If transfer makes sense, replace the saved ability
        if (
          (transferLevel > 0 && pickedLevel === 0) ||
          (finalAbility === "蛮熊碎颅击" &&
            char?.gender === "女" &&
            transferLevel > 0)
        ) {
          finalAbility = transferable;
        }
      }

      markStartedIfNeeded();
      onSave(floor, {
        ability: finalAbility, // ✅ save the real transferable ability
        level: chosenDrop.level,
        characterId: charId,
        noDrop: false,
      });
    }
  };

  /** 🧠 Run recommendation logic */
  const { bestCandidate, steps = [], tiedCandidates = [] } =
    chosenDrop && chosenDrop !== "noDrop"
      ? pickBestCharacterWithTrace(
          chosenDrop.ability,
          chosenDrop.level,
          group,
          dropList
        )
      : { bestCandidate: null, steps: [], tiedCandidates: [] };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.sectionDivider}>角色</div>

      {/* ==== Character selection grid ==== */}
      <div className={styles.memberGrid}>
        {group.characters.map((c: any) => {
          let shownAbility = chosenDrop?.ability || "";
          let shownLevel = 0;
          let disabled = !chosenDrop;
          let isTransferred = false;

          if (chosenDrop && chosenDrop !== "noDrop") {
            const picked = chosenDrop.ability;
            const transferable = getTransferableAbility(picked, c.gender);

            let hasTransfer = false;
            if (transferable) {
              const transferLevel = c.abilities?.[transferable] ?? 0;
              const pickedLevel = c.abilities?.[picked] ?? 0;

              // 🧩 Determine if transferred display should be used
              if (
                (transferLevel > 0 && pickedLevel === 0) ||
                (picked === "蛮熊碎颅击" &&
                  c.gender === "女" &&
                  transferLevel > 0)
              ) {
                shownAbility = transferable;
                shownLevel = transferLevel;
                isTransferred = true;
                hasTransfer = true;
              }
            }

            if (!hasTransfer) {
              shownLevel = c.abilities?.[picked] ?? 0;
            }

            if (shownLevel >= chosenDrop.level) disabled = true;
          }

          const progressText = getBossProgressText(
            dropList,
            c,
            chosenDrop?.level
          );
          const progressColor = getProgressColor(progressText);

          const isBest =
            bestCandidate && bestCandidate.name === c.name && !disabled;
          const isTied =
            tiedCandidates && tiedCandidates.includes(c.name) && !disabled;

          let colorClass = "";
          if (!disabled && chosenDrop && chosenDrop !== "noDrop") {
            if (isTied) colorClass = styles.diamond; // 💎 tie case
            else if (isBest) colorClass = styles.levelGreen;
            else colorClass = styles.levelYellow;
          }

          const abilityIcon =
            isTransferred && shownAbility
              ? getAbilityIcon(shownAbility)
              : null;

          return (
            <button
              key={c._id || c.id}
              className={`${styles.memberBtn} ${colorClass} ${
                disabled ? styles.memberDisabled : ""
              }`}
              onClick={() => !disabled && handleAssign(c._id || c.id)}
              disabled={disabled}
            >
              <div className={styles.topRow}>
                <span className={styles.nameAndIcon}>
                  {c.name}
                  {abilityIcon && (
                    <img
                      src={abilityIcon}
                      alt={shownAbility}
                      className={styles.abilityIconSmall}
                    />
                  )}
                  <span>({shownLevel}重)</span>
                </span>
                <span className={`${styles.progressText} ${progressColor}`}>
                  {progressText}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ==== Reasoning / Info Box ==== */}
      {steps.length > 0 && (
        <div className={styles.reasonBox}>
          <div className={styles.reasonTitle}>推荐理由</div>
          <ul className={styles.reasonList}>
            {steps.map((s, i) => {
              let className = styles.failed;
              if (s.passed === true) className = styles.passed;
              else if (s.passed === "fallback") className = styles.fallback; // 💎 tie
              return (
                <li key={i} className={className}>
                  {s.reason}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
