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
        const isElite = floor === 90 || floor === 100;
        const bossName =
          data?.[floor]?.boss ??
          (floorAssignments ? floorAssignments[floor] : undefined);

        const isClickable = !readonly && typeof onClickFloor === "function";

        return (
          <div
            key={floor}
            className={`${styles.card} ${
              isElite ? styles.eliteCard : ""
            } ${isClickable ? styles.clickable : ""}`}
            onClick={() => {
              if (isClickable) onClickFloor!(floor);
            }}
          >
            <div className={styles.floorLabel}>{floor}</div>
            <div className={styles.value}>
              {bossName || (readonly ? "未选择" : "请选择")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
