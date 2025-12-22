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

const highlightBosses = new Set(["鬼影小次郎", "秦雷", "冯度", "阿依努尔","卫栖梧"]);

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

        // ⭐ use original eliteCard styling, but based on bossName
        const eliteClass =
          bossName && highlightBosses.has(bossName)
            ? styles.eliteCard
            : "";

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
