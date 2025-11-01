"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./styles.module.css";
import SingleBossDrops from "@/app/data/Single_Boss_Drops.json";
import { getBossProgressText } from "../drophelpers";
import { pickBestCharacterWithTrace } from "./RecommandWindow/recommendation";
import RecommendationWindow, { RecommendationStep } from "./RecommandWindow";

/* ✅ Role color mapping */
const roleColors: Record<string, { bg: string; text: string }> = {
  tank: { bg: "#fff3cd", text: "#8b4513" },
  dps: { bg: "#d4edda", text: "#155724" },
  healer: { bg: "#f8d7da", text: "#721c24" },
};

/* === Types === */
type StorageItem = { ability: string; level: number; used?: boolean };
type Char = {
  _id: string;
  name: string;
  gender?: "男" | "女";
  role?: "tank" | "dps" | "healer";
  abilities: Record<string, number>;
  storage?: StorageItem[];
};

/* === Component === */
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
  const rightColumnRef = useRef<HTMLDivElement>(null);

  /* === 🧠 Persist showReasoning across reloads === */
  const [showReasoning, setShowReasoning] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("showReasoning");
      return stored ? stored === "true" : true; // default true
    }
    return true;
  });

  const toggleReasoning = () => {
    setShowReasoning((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("showReasoning", String(next));
      }
      return next;
    });
  };

  /* === Find which boss drop list this ability belongs to === */
  const dropList =
    selectedAbility &&
    Object.entries(SingleBossDrops).find(([_, list]) =>
      list.includes(selectedAbility)
    )?.[1];

  /* === Get recommendation result === */
  const { bestCandidate, steps = [], tiedCandidates = [] } =
    selectedAbility && selectedLevel
      ? pickBestCharacterWithTrace(
          selectedAbility,
          selectedLevel,
          group,
          dropList || []
        )
      : { bestCandidate: null, steps: [], tiedCandidates: [] };

  /* === Helpers === */
  const getProgressColor = (text: string) => {
    if (text.includes("十重") || text.includes("全收集")) return styles.progressGreen;
    if (text.includes("九重")) return styles.progressYellow;
    return styles.progressPink;
  };

  /* === Render === */
  return (
    <div className={styles.rightColumn} ref={rightColumnRef}>
      {/* === Centered Header with Divider Lines === */}
      <div className={styles.sectionDivider}>
        <span className={styles.sectionTitle}>
          角色{" "}
          {steps.length > 0 && (
            <button
              className={`${styles.helpCircle} ${
                showReasoning ? styles.helpCircleActive : styles.helpCircleInactive
              }`}
              title={showReasoning ? "隐藏推荐决策" : "显示推荐决策"}
              onClick={toggleReasoning}
            >
              ?
            </button>
          )}
        </span>
      </div>

      {/* === Character Buttons === */}
      <div className={styles.memberGrid}>
        {group.characters.map((c) => {
          const learned = c.abilities?.[selectedAbility] ?? 0;
          const disabled =
            !selectedAbility || !selectedLevel || learned >= selectedLevel;

          const progressText = dropList?.length
            ? getBossProgressText(dropList, c, selectedLevel)
            : "";
          const progressColor = getProgressColor(progressText);

          const isBest = bestCandidate && bestCandidate._id === c._id && !disabled;
          const isTied = tiedCandidates?.includes(c.name) && !disabled;

          const colorStyle =
            c.role && roleColors[c.role]
              ? {
                  backgroundColor: roleColors[c.role].bg,
                  color: roleColors[c.role].text,
                }
              : {};

          let colorClass = "";
          if (!disabled && selectedAbility && selectedLevel) {
            if (isTied) colorClass = styles.diamond;
            else if (isBest) colorClass = styles.levelGreen;
            else colorClass = styles.levelYellow;
          }

          const hasStored10 =
            c.storage?.some(
              (s) => s.ability === selectedAbility && s.level === 10 && !s.used
            ) && selectedLevel === 9;

          return (
            <button
              key={c._id}
              disabled={disabled}
              onClick={() => !disabled && setSelectedCharacter(c)}
              className={`${styles.memberBtn} ${colorClass} ${
                disabled ? styles.memberDisabled : ""
              } ${selectedCharacter?._id === c._id ? styles.active : ""}`}
              style={colorStyle}
            >
              <div className={styles.topRow}>
                <span className={styles.name}>
                  {c.name}（{learned}）
                </span>
                {progressText && (
                  <span className={`${styles.progressText} ${progressColor}`}>
                    {progressText}
                  </span>
                )}
              </div>

              {hasStored10 && (
                <div className={styles.backpackWarning}>⚠️ 背包有10</div>
              )}
            </button>
          );
        })}
      </div>

      {/* === Floating Recommendation Window === */}
      {showReasoning && steps.length > 0 && (
        <RecommendationWindow steps={steps} parentRef={rightColumnRef} />
      )}
    </div>
  );
}
