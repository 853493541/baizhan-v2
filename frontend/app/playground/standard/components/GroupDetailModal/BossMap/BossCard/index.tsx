"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import { calcBossNeeds } from "./calcBossNeeds";

import BossCardHeader from "./BossControl";
import BossCardNeeds from "./NeedsList";
import { renderPrimaryDrop, renderSecondaryDrop } from "./DropsResults";

/* ✅ SINGLE SOURCE OF TRUTH */
import tradableAbilities from "@/app/data/tradable_abilities.json";

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
     STATE
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
     GUARD
  ================================= */
  if (!boss) {
    return (
      <div className={styles.card}>
        <div className={styles.floorLabel}>{floor}</div>
        <div className={styles.noNeed}>未选择</div>
      </div>
    );
  }

  /* ===============================
     DROP LEVEL
  ================================= */
  const dropLevel: 9 | 10 = floor >= 81 && floor <= 90 ? 9 : 10;

  /* ===============================
     NEEDS
  ================================= */
  const needs = calcBossNeeds({
    boss,
    bossData,
    group,
    activeMembers,
    dropLevel,
    highlightAbilities,
  });

  /* ===============================
     DROP LISTS
  ================================= */
  const fullDropList: string[] = bossData[boss] || [];
  const tradableList = fullDropList.filter((a) => tradableSet.has(a));
  const dropList = fullDropList.filter((a) => !tradableSet.has(a));

  /* ===============================
     DROP RENDERING
  ================================= */
  const primary = renderPrimaryDrop({ kill, group });
  const secondary = renderSecondaryDrop({ kill, group });

  /**
   * Pager rule (FINAL):
   * - boss eligible (from parent)
   * - primary exists
   * - secondary slot exists
   */
  const canPage =
    !!canShowSecondary &&
    !!kill?.selection &&
    !!kill?.selectionSecondary;

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

  return (
    <div
      className={`${styles.card} ${styles.cardInteractive} ${
        primary?.className || ""
      }`}
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
