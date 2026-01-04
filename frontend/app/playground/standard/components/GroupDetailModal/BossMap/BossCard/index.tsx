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
 * ✅ Determine card background class based on selection
 * IMPORTANT:
 * - EMPTY selection returns ""
 * - Explicit noDrop returns healer color
 */
function getSelectionCardClass(
  selection: any,
  tradableSet: Set<string>
): string {
  if (!selection) return "";

  if (selection.noDrop === true) return styles.cardHealer;

  const ability = selection.ability;
  const characterId = selection.characterId;

  // ⛔ empty slot → neutral background
  if (!ability && !characterId) return styles.cardTank;

  if (ability && tradableSet.has(ability)) return styles.cardPurple;

  if (ability && !characterId) return styles.cardHealer;

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

    onSelect,          // primary drop modal
    onSelectSecondary, // secondary drop modal

    // ⭐ fully controlled by BossMap
    canShowSecondary,
  } = props;

  /* ===============================
     STATE (HOOKS ALWAYS RUN)
  ================================= */
  const [dropPage, setDropPage] = useState<1 | 2>(1);

  useEffect(() => {
    setDropPage(1);
  }, [kill?.selection, kill?.selectionSecondary]);

  const tradableSet = useMemo(
    () => new Set<string>(tradableAbilities),
    []
  );

  /* ===============================
     DROP LEVEL
  ================================= */
  const dropLevel: 9 | 10 =
    floor >= 81 && floor <= 90 ? 9 : 10;

  /* ===============================
     NEEDS (SAFE)
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
  }, [
    boss,
    bossData,
    group,
    activeMembers,
    dropLevel,
    highlightAbilities,
  ]);

  /* ===============================
     DROP LISTS
  ================================= */
  const fullDropList: string[] =
    boss ? bossData[boss] || [] : [];

  const tradableList = fullDropList.filter((a) =>
    tradableSet.has(a)
  );

  const dropList = fullDropList.filter(
    (a) => !tradableSet.has(a)
  );

  /* ===============================
     DROP RENDERING
  ================================= */
  const primary = renderPrimaryDrop({ kill, group });
  const secondary = renderSecondaryDrop({ kill, group });

  /**
   * Pager rule:
   * - boss eligible
   * - primary exists
   * - secondary slot exists
   */
  const canPage =
    !!canShowSecondary &&
    !!kill?.selection &&
    !!kill?.selectionSecondary;

  /* ===============================
     ✅ ACTIVE BACKGROUND CLASS
     (THIS IS THE KEY FIX)
  ================================= */
  const activeCardClass = useMemo(() => {
    // PAGE 1 → primary color
    if (dropPage === 1) {
      return primary?.className || "";
    }

    // PAGE 2
    if (!canShowSecondary) return "";

    const sel2 = kill?.selectionSecondary;
    if (!sel2) return "";

    return getSelectionCardClass(sel2, tradableSet);
  }, [
    dropPage,
    canShowSecondary,
    primary?.className,
    kill?.selectionSecondary,
    tradableSet,
  ]);

  /* ===============================
     CLICK LOGIC
  ================================= */
  const handleCardClick = () => {
    if (dropPage === 2) {
      if (!canShowSecondary) return;

      onSelectSecondary?.(
        floor,
        boss,
        dropList,
        tradableList,
        dropLevel
      );
    } else {
      onSelect(
        floor,
        boss,
        dropList,
        tradableList,
        dropLevel
      );
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
                <div className={styles.secondaryHint}>
                  点击添加掉落
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* =========================
         PAGER
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
