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
      {floors.map((floor) => {
        const isElite = floor === 90 || floor === 100;

        // 🔹 When readonly, prefer `data[floor].boss` (history),
        //    but fall back to `floorAssignments[floor]` (current week locked).
        const readonlyBoss =
          data?.[floor]?.boss ?? floorAssignments[floor] ?? "未选择";

        return (
          <div
            key={floor}
            className={`${styles.card} ${isElite ? styles.eliteCard : ""}`}
          >
            <div className={styles.floorLabel}>{floor}</div>

            {readonly ? (
              <div className={styles.readonlyValue}>{readonlyBoss}</div>
            ) : (
              <select
                className={`${styles.dropdown} ${
                  isElite ? styles.dropdownElite : ""
                }`}
                value={floorAssignments[floor] || ""}
                onChange={(e) => onSelect && onSelect(floor, e.target.value)}
              >
                <option value="">请选择</option>
                {getAvailableBosses &&
                  getAvailableBosses(floor).map((boss) => (
                    <option key={boss} value={boss}>
                      {boss}
                    </option>
                  ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
