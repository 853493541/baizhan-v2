"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import styles from "./styles.module.css";

import BossCardHeader from "./BossControl";
import BossCardNeeds from "./NeedsList";
import { renderPrimaryDrop, renderSecondaryDrop } from "./DropsResults";

/* ✅ SINGLE SOURCE OF TRUTH */
import tradableAbilities from "@/app/data/tradable_abilities.json";

import { useBossCardLogic } from "./bossCard.logic";

/* ======================================================
   🧬 MUTATION → DOWNGRADED BOSS MAP
====================================================== */
const MUTATION_DOWNGRADE_MAP: Record<string, string> = {
  "困境韦柔丝": "韦柔丝",
  "青年程沐华": "程沐华",
  "肖红·变异": "肖红",
};

export default function BossCard(props: any) {
  const {
    floor,
    boss,
    group,
    bossData,
    highlightAbilities,
    kill,
    activeMembers = [0, 1, 2],
    onSelect,
    onSelectSecondary,
    canShowSecondary,
  } = props;

  const tradableSet = useMemo(
    () => new Set<string>(tradableAbilities),
    []
  );

  /* ===============================
     DROP RENDERING
  ================================ */
  const primary = renderPrimaryDrop({ kill, group });
  const secondary = renderSecondaryDrop({ kill, group });

  /* ===============================
     🧬 DOWNGRADED BOSS (SECONDARY ONLY)
  ================================ */
  const downgradedBoss =
    canShowSecondary && MUTATION_DOWNGRADE_MAP[boss]
      ? MUTATION_DOWNGRADE_MAP[boss]
      : boss;

  /* ===============================
     ✅ WRAPPED SECONDARY SELECT
     - downgrade boss
     - downgrade dropList
     - downgrade tradableList
     - page 1 untouched
  ================================ */
  const handleSelectSecondaryWrapped = useCallback(
    (
      floor: number,
      _boss: string,
      _dropList: string[],
      _tradableList: string[],
      dropLevel: 9 | 10
    ) => {
      const downgradedDropList = bossData[downgradedBoss] ?? [];

      const downgradedTradables = downgradedDropList.filter((a: string) =>
        tradableSet.has(a)
      );

      onSelectSecondary(
        floor,
        downgradedBoss,
        downgradedDropList,
        downgradedTradables,
        dropLevel
      );
    },
    [onSelectSecondary, downgradedBoss, bossData, tradableSet]
  );

  /* ===============================
     LOGIC (AUTHORITATIVE)
     ⚠️ Logic always uses original boss
  ================================ */
  const {
    dropPage,
    setDropPage,
    needs,
    canPage,
    activeCardClass,
    handleCardClick,
    handleNextButtonClick,
    willDirectOpenSecondary,
  } = useBossCardLogic({
    floor,
    boss, // ❌ NEVER downgraded here
    group,
    bossData,
    highlightAbilities,
    kill,
    activeMembers,
    canShowSecondary,
    onSelect,
    onSelectSecondary: handleSelectSecondaryWrapped, // ✅ injected
    tradableSet,
    primaryClassName: primary?.className,
  });

  /* ===============================
     ✅ RESET FIX
  ================================ */
  useEffect(() => {
    if (!kill && dropPage !== 1) {
      setDropPage(1);
    }
  }, [kill, dropPage, setDropPage]);

  /* ===============================
     GUARD
  ================================ */
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
         PAGE 1 — PRIMARY
         ❌ NEVER downgraded
      ========================= */}
      {dropPage === 1 && (
        <>
          {!primary && <BossCardNeeds needs={needs} />}
          {primary && primary.node}
        </>
      )}

      {/* =========================
         PAGE 2 — SECONDARY
         ✅ DOWNGRADED BOSS + DROPS + TRADABLES
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
                  点击添加掉落（{downgradedBoss}）
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* =========================
         PAGER
      ========================= */}
      {canShowSecondary && (
        <div className={styles.dropPager}>
          {dropPage === 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextButtonClick();
              }}
            >
              {willDirectOpenSecondary ? "+" : "›"}
            </button>
          )}

          {dropPage === 2 && canPage && (
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
