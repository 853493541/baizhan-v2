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

    onSelect,          // primary
    onSelectSecondary, // secondary

    // ⭐ CONTROLLED BY PARENT (BossMap)
    canShowSecondary,  // boolean
  } = props;

  /* ===============================
     HOOKS
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
     Guard: no boss
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
     Drop level
  ================================= */
  const dropLevel: 9 | 10 = floor >= 81 && floor <= 90 ? 9 : 10;

  /* ===============================
     Needs
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
     Drops for modal
  ================================= */
  const fullDropList: string[] = bossData[boss] || [];
  const tradableList = fullDropList.filter((a) => tradableSet.has(a));
  const dropList = fullDropList.filter((a) => !tradableSet.has(a));

  /* ===============================
     Drop rendering
  ================================= */
  const primary = renderPrimaryDrop({ kill, group });
  const secondary = renderSecondaryDrop({ kill, group });

  // ✅ FINAL RULE:
  // pager exists ONLY if parent says boss is eligible
  // AND both drops actually exist
  const canPage =
    !!canShowSecondary &&
    !!kill?.selection &&
    !!kill?.selectionSecondary;

  /* ===============================
     CLICK LOGIC
  ================================= */
  const handleCardClick = () => {
    if (dropPage === 2) {
      if (!canShowSecondary || !kill?.selectionSecondary) return;

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

      {!primary && <BossCardNeeds needs={needs} />}

      {primary && dropPage === 1 && primary.node}
      {secondary && dropPage === 2 && secondary}

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
