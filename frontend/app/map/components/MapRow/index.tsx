"use client";

import React from "react";
import styles from "./styles.module.css";

interface Props {
  floors: number[];
  floorAssignments?: Record<number, string>;
  data?: Record<number, { boss: string }>;
  readonly?: boolean;
  onClickFloor?: (floor: number) => void;
}

/* ⭐ 精英 Boss */
const highlightBosses = new Set([
  "鬼影小次郎",
  "秦雷",
  "冯度",
  "阿依努尔",
  "卫栖梧",
]);

/* 🧬 Mutated Boss（异类） */
const mutatedBosses = new Set([
  "肖红",
  "青年程沐华",
  "困境韦柔丝",
]);

export default function MapRow({
  floors,
  floorAssignments = {},
  data,
  readonly = false,
  onClickFloor,
}: Props) {
  return (
    <div className={styles.row}>
      {floors.map((floor) => {
        const bossName =
          data?.[floor]?.boss ??
          (floorAssignments ? floorAssignments[floor] : undefined);

        const isClickable = !readonly && typeof onClickFloor === "function";

        const displayText = bossName
          ? bossName
          : readonly
          ? "未选择"
          : "请选择";

        // 🔥 red text for empty floors
        const emptyClass = !bossName ? styles.emptyRed : "";

        // ⭐ elite style
        const eliteClass =
          bossName && highlightBosses.has(bossName)
            ? styles.eliteCard
            : "";

        // 🧬 mutated boss
        const isMutatedBoss =
          bossName && mutatedBosses.has(bossName);

        // 🔁 换标识：90 / 100 层 + 已选 Boss
        const showSwapBadge =
          !!bossName && (floor === 90 || floor === 100);

        return (
          <div
            key={floor}
            className={`${styles.card} ${eliteClass} ${
              isClickable ? styles.clickable : ""
            }`}
            onClick={() => {
              if (isClickable) onClickFloor!(floor);
            }}
          >
            {/* 🧬 Mutated boss badge */}
            {isMutatedBoss && (
              <div className={styles.mutatedBossBadge}>异</div>
            )}

            {/* 🔁 Swap badge */}
            {showSwapBadge && (
              <div className={styles.swapBadge}>换</div>
            )}

            <div className={styles.floorLabel}>{floor}</div>
            <div className={`${styles.value} ${emptyClass}`}>
              {displayText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
