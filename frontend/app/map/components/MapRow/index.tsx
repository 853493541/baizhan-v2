"use client";

import React from "react";
import styles from "./styles.module.css";

interface Props {
  floors: number[];
  floorAssignments?: Record<number, string>;
  data?: Record<number, { boss: string }>;
  readonly?: boolean;
  onSelect?: (floor: number, boss: string) => void;
  getAvailableBosses?: (floor: number) => string[];
}

export default function MapRow({
  floors,
  floorAssignments = {},
  data,
  readonly = false,
  onSelect,
  getAvailableBosses,
}: Props) {
  return (
    <div className={styles.row}>
      {floors.map((floor) => (
        <div key={floor} className={styles.card}>
          <div className={styles.floorLabel}>{floor}</div>
          {readonly ? (
            <div className={styles.readonlyValue}>
              {data?.[floor]?.boss || "未选择"}
            </div>
          ) : (
            <select
              className={
                floor === 90 || floor === 100
                  ? `${styles.dropdown} ${styles.dropdownElite}`
                  : styles.dropdown
              }
              value={floorAssignments[floor] || ""}
              onChange={(e) => onSelect && onSelect(floor, e.target.value)}
            >
              <option value="">-- 请选择 --</option>
              {getAvailableBosses &&
                getAvailableBosses(floor).map((boss) => (
                  <option key={boss} value={boss}>
                    {boss}
                  </option>
                ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
