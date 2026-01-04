"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import { calcBossNeeds } from "./calcBossNeeds";

import BossCardHeader from "./BossControl";
import BossCardNeeds from "./NeedsList";
import { renderPrimaryDrop, renderSecondaryDrop } from "./DropsResults";

/* ✅ SINGLE SOURCE OF TRUTH */
import tradableAbilities from "@/app/data/tradable_abilities.json";

/**
 * ✅ Determine card background class based on selection shape.
 * Must match the same meaning as DropsResults rendering:
 * - noDrop OR empty selection => healer/noDrop styling
 * - tradable => purple
 * - wasted (ability but no characterId) => healer
 * - assigned => normal
 */
function getSelectionCardClass(
  selection: any,
  tradableSet: Set<string>
): string {
  if (!selection) return "";

  // Explicit noDrop OR empty object selection (no ability + no character)
  // NOTE: Primary still treats "empty" as noDrop visually; secondary now returns null for empty,
  // but background should be neutral in that case (handled by caller).
  if (selection.noDrop === true) return styles.cardHealer;

  const ability = selection.ability;
  const characterId = selection.characterId;

  if (!ability && !characterId) return styles.cardHealer;

  if (ability && tradableSet.has(ability)) return styles.cardPurple;

  if (ability && !characterId) return styles.cardHealer;

  // assigned
  return styles.cardNormal;
}

export default function BossCard(props: any) {
  const {
    floor,
    boss,
    group,
    bossData,
    highlightAbilities,
    kill,
    activeMembers = [0, 1, 2],

    onSelect, // primary drop modal
    onSelectSecondary, // secondary drop modal

    // ⭐ fully controlled by BossMap
    canShowSecondary,
  } = props;

  /* ===============================
     STATE (HOOKS MUST ALWAYS RUN)
  ================================= */
  const [dropPage, setDropPage] = useState<1 | 2>(1);

  useEffect(() => {
    setDropPage(1);
  }, [kill?.selection, kill?.selectionSecondary]);

  const tradableSet = useMemo(() => new Set<string>(tradableAbilities), []);

  /* ===============================
     DROP LEVEL
  ================================= */
  const dropLevel: 9 | 10 = floor >= 81 && floor <= 90 ? 9 : 10;

  /* ===============================
     NEEDS (safe when boss missing)
  ================================= */
  const needs = useMemo(() => {
    if (!boss) return [];
    return calcBossNeeds({
      boss,
      bossData,
      group,
      activeMembers,
      dropLevel,
      highlightAbilities,
    });
  }, [boss, bossData, group, activeMembers, dropLevel, highlightAbilities]);

  /* ===============================
     DROP LISTS (safe when boss missing)
  ================================= */
  const fullDropList: string[] = boss ? bossData[boss] || [] : [];
  const tradableList = fullDropList.filter((a) => tradableSet.has(a));
  const dropList = fullDropList.filter((a) => !tradableSet.has(a));

  /* ===============================
     DROP RENDERING
  ================================= */
  const primary = renderPrimaryDrop({ kill, group });
  const secondary = renderSecondaryDrop({ kill, group });

  /**
   * Pager rule (unchanged):
   * - boss eligible (from parent)
   * - primary exists
   * - secondary slot exists
   */
  const canPage =
    !!canShowSecondary && !!kill?.selection && !!kill?.selectionSecondary;

  /* ===============================
     ✅ BACKGROUND SHOULD FOLLOW DISPLAYED PAGE
     - page 1 => primary visual class (from primary result)
     - page 2 => secondary visual class (derived from selectionSecondary)
               if secondary is empty (null), keep neutral ("")
  ================================= */
  const activeCardClass = useMemo(() => {
    if (dropPage === 1) {
      return primary?.className || "";
    }

    // page 2
    if (!canShowSecondary) return "";

    // If there's an actual secondary result rendered, derive bg from selectionSecondary
    // If selectionSecondary exists but is empty (your "slot"), keep neutral.
    const sel2 = kill?.selectionSecondary;

    if (!sel2) return "";
    if (!sel2.ability && !sel2.characterId && sel2.noDrop !== true) {
      // empty slot => neutral background
      return "";
    }

    return getSelectionCardClass(sel2, tradableSet);
  }, [dropPage, canShowSecondary, primary?.className, kill?.selectionSecondary, tradableSet]);

  /* ===============================
     CLICK LOGIC (unchanged)
  ================================= */
  const handleCardClick = () => {
    if (dropPage === 2) {
      if (!canShowSecondary) return;

      onSelectSecondary?.(floor, boss, dropList, tradableList, dropLevel);
    } else {
      onSelect(floor, boss, dropList, tradableList, dropLevel);
    }
  };

  /* ===============================
     GUARD (AFTER HOOKS)
  ================================= */
  if (!boss) {
    return (
      <div className={styles.card}>
        <div className={styles.floorLabel}>{floor}</div>
        <div className={styles.noNeed}>未选择</div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.card} ${styles.cardInteractive} ${activeCardClass}`}
      onClick={handleCardClick}
    >
      <BossCardHeader {...props} />

      {/* =========================
         PAGE 1 — PRIMARY DROP
      ========================= */}
      {dropPage === 1 && (
        <>
          {!primary && <BossCardNeeds needs={needs} />}
          {primary && primary.node}
        </>
      )}

      {/* =========================
         PAGE 2 — SECONDARY DROP
      ========================= */}
      {dropPage === 2 && (
        <>
          {secondary ? (
            secondary
          ) : (
            canShowSecondary && (
              <div className={styles.secondaryEmptyDrop}>
                <div className={styles.secondaryPlusIcon}>+</div>
                <div className={styles.secondaryHint}>点击添加掉落</div>
              </div>
            )
          )}
        </>
      )}

      {/* =========================
         PAGER (unchanged)
      ========================= */}
      {canPage && (
        <div className={styles.dropPager}>
          {dropPage === 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropPage(2);
              }}
            >
              ›
            </button>
          )}

          {dropPage === 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropPage(1);
              }}
            >
              ‹
            </button>
          )}
        </div>
      )}
    </div>
  );
}
