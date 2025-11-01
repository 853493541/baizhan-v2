"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { getAbilityIcon, getBossProgressText } from "../drophelpers";
import { pickBestCharacterWithTrace } from "./RecommandWindow/recommendation";
import type { RecommendationStep } from "./RecommandWindow/recommendation";

/** 🔄 Gender-based transferable skill rules */
function getTransferableAbility(
  pickedAbility: string,
  gender: string | undefined
): string | null {
  if (pickedAbility === "剑心通明" && gender === "男") return "巨猿劈山";
  if (pickedAbility === "巨猿劈山" && gender === "女") return "剑心通明";
  if (pickedAbility === "蛮熊碎颅击" && gender === "女") return "水遁水流闪";
  return null;
}

/* === Always-visible reasoning window === */
function RecommendationWindow({
  steps,
  parentRef,
}: {
  steps: RecommendationStep[];
  parentRef: React.RefObject<HTMLDivElement>;
}) {
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = parentRef.current;
    const windowEl = windowRef.current;
    if (!parent || !windowEl) return;

    const updatePosition = () => {
      const rect = parent.getBoundingClientRect();
      const windowHeight = windowEl.offsetHeight;
      const top = rect.height / 2 - windowHeight / 2;
      windowEl.style.top = `${top}px`;
      windowEl.style.left = `${rect.width + 24}px`;
      windowEl.style.position = "absolute";
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [parentRef, steps.length]);

  if (!steps || steps.length === 0) return null;

  const getClass = (passed: boolean | "fallback" | undefined) => {
    if (passed === true) return styles.passed;
    if (String(passed).toLowerCase() === "fallback") return styles.fallback;
    return styles.failed;
  };

  return (
    <div ref={windowRef} className={styles.window}>
      <div className={styles.header}>
        <span className={styles.title}>推荐决策过程</span>
      </div>
      <div className={styles.content}>
        <ul className={styles.stepList}>
          {steps.map((step, i) => (
            <li key={i} className={getClass(step.passed)}>
              {step.reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* === Main Component === */
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
  const rightColumnRef = useRef<HTMLDivElement>(null);

  const [showReasoning, setShowReasoning] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showReasoningWindow");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  const markStartedIfNeeded = () => {
    if (groupStatus === "not_started" && onMarkStarted) onMarkStarted();
  };

  const getProgressColor = (progress: string) => {
    if (progress.includes("十重") || progress.includes("全收集"))
      return styles.progressGreen;
    if (progress.includes("九重")) return styles.progressYellow;
    return styles.progressPink;
  };

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

      const transferable = getTransferableAbility(finalAbility, char?.gender);
      if (transferable) {
        const transferLevel = char?.abilities?.[transferable] ?? 0;
        const pickedLevel = char?.abilities?.[finalAbility] ?? 0;

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
        ability: finalAbility,
        level: chosenDrop.level,
        characterId: charId,
        noDrop: false,
      });
    }
  };

  const { bestCandidate, steps = [], tiedCandidates = [] } =
    chosenDrop && chosenDrop !== "noDrop"
      ? pickBestCharacterWithTrace(
          chosenDrop.ability,
          chosenDrop.level,
          group,
          dropList
        )
      : { bestCandidate: null, steps: [], tiedCandidates: [] };

  const handleToggleReasoning = () => {
    const newState = !showReasoning;
    setShowReasoning(newState);
    localStorage.setItem("showReasoningWindow", JSON.stringify(newState));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const parentEl = rightColumnRef.current;
      const reasoningEl = document.querySelector(`.${styles.window}`);
      if (
        showReasoning &&
        parentEl &&
        !parentEl.contains(event.target as Node) &&
        reasoningEl &&
        !reasoningEl.contains(event.target as Node)
      ) {
        setShowReasoning(false);
        localStorage.setItem("showReasoningWindow", JSON.stringify(false));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showReasoning]);

  const showHelpButton =
    chosenDrop && chosenDrop !== "noDrop" && steps.length > 0;

  return (
    <div className={styles.rightColumn} ref={rightColumnRef}>
      <div className={styles.sectionDivider}>
        角色
        {showHelpButton && (
          <button
            className={`${styles.helpCircle} ${
              showReasoning
                ? styles.helpCircleActive
                : styles.helpCircleInactive
            }`}
            title={showReasoning ? "隐藏推荐决策" : "显示推荐决策"}
            onClick={handleToggleReasoning}
          >
            ?
          </button>
        )}
      </div>

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

            if (!hasTransfer) shownLevel = c.abilities?.[picked] ?? 0;
            if (shownLevel >= chosenDrop.level) disabled = true;
          }

          // 📦 Backpack check — level 10 in backpack (including transferred ability)
          let hasLevel10InBackpack = false;
          if (Array.isArray(c.storage)) {
            const abilityToCheck = isTransferred ? shownAbility : chosenDrop?.ability;
            hasLevel10InBackpack = c.storage.some(
              (item: any) => item.ability === abilityToCheck && item.level === 10
            );
          }

          const progressText = getBossProgressText(dropList, c, chosenDrop?.level);
          const progressColor = getProgressColor(progressText);

          const isBest =
            bestCandidate && bestCandidate.name === c.name && !disabled;
          const isTied =
            tiedCandidates && tiedCandidates.includes(c.name) && !disabled;

          let colorClass = "";
          if (!disabled && chosenDrop && chosenDrop !== "noDrop") {
            if (isTied) colorClass = styles.diamond;
            else if (isBest) colorClass = styles.levelGreen;
            else colorClass = styles.levelYellow;
          }

          const abilityIcon =
            isTransferred && shownAbility ? getAbilityIcon(shownAbility) : null;

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

              {/* ⚠️ Backpack line */}
              {hasLevel10InBackpack && (
                <div className={styles.backpackWarning}>⚠️ 背包有10</div>
              )}
            </button>
          );
        })}
      </div>

      {showHelpButton && showReasoning && (
        <RecommendationWindow steps={steps} parentRef={rightColumnRef} />
      )}
    </div>
  );
}
