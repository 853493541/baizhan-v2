"use client";

import React, { useMemo } from "react";
import styles from "./styles.module.css";

import BossCardHeader from "./BossControl";
import BossCardNeeds from "./NeedsList";
import { renderPrimaryDrop, renderSecondaryDrop } from "./DropsResults";

/* ✅ SINGLE SOURCE OF TRUTH */
import tradableAbilities from "@/app/data/tradable_abilities.json";

import { useBossCardLogic } from "./bossCard.logic";

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
  ================================= */
  const primary = renderPrimaryDrop({ kill, group });
  const secondary = renderSecondaryDrop({ kill, group });

  /* ===============================
     ALL LOGIC LIVES HERE NOW
  ================================= */
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
    boss,
    group,
    bossData,
    highlightAbilities,
    kill,
    activeMembers,
    canShowSecondary,
    onSelect,
    onSelectSecondary,
    tradableSet,
    primaryClassName: primary?.className,
  });

  /* ===============================
     🔍 DEBUG — SECOND DROP LOGIC
  ================================= */
  console.log("[second2]", {
    boss,
    dropPage,
    canShowSecondary,
    hasSecondaryDrop: !!kill?.selectionSecondary,
    willDirectOpenSecondary,
    canPage,
  });

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
         PAGER (FIXED GUARD)
      ========================= */}
      {canShowSecondary && (
        <div className={styles.dropPager}>
          {/* ▶ NEXT / ADD */}
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

          {/* ◀ BACK */}
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
