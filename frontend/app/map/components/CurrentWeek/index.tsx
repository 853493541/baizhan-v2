"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

interface Props {
  row1: number[];
  row2: number[];
  floorAssignments: Record<number, string>;
  onSelect: (floor: number, boss: string) => void;
  getAvailableBosses: (floor: number) => string[];
  onDelete: () => void;
  status: "idle" | "saving" | "success" | "error";
  locked: boolean;
  onLock: () => void;
}

export default function CurrentWeek({
  row1,
  row2,
  floorAssignments,
  onSelect,
  getAvailableBosses,
  onDelete,
  status,
  locked,
  onLock,
}: Props) {
  const [confirm, setConfirm] = useState(false);

  const totalFloors = row1.length + row2.length;
  const selectedCount = Object.keys(floorAssignments).length;
  const isComplete = row1.concat(row2).every((f) => floorAssignments[f]);

  const renderRow = (floors: number[]) =>
    floors.map((floor) => {
      const boss = floorAssignments[floor] || "";
      return (
        <div key={floor} className={styles.card}>
          <div className={styles.floorLabel}>{floor}</div>
          {!locked ? (
            <select
              className={
                floor === 90 || floor === 100
                  ? `${styles.dropdown} ${styles.dropdownElite}`
                  : styles.dropdown
              }
              value={boss}
              onChange={(e) => onSelect(floor, e.target.value)}
            >
              <option value="">请选择</option>
              {getAvailableBosses(floor).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : (
            <div className={styles.readonlyValue}>{boss || "未选择"}</div>
          )}
        </div>
      );
    });

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>本周地图</h1>

      <div className={styles.mapBox}>
        <div className={styles.row}>{renderRow(row1)}</div>
        <div className={styles.row}>{renderRow(row2)}</div>

        <div className={styles.footer}>
          <p className={styles.counter}>
            已选择 {selectedCount} / {totalFloors}
            {status === "saving" && <span>💾</span>}
            {status === "success" && <span>✅</span>}
            {status === "error" && <span>❌</span>}
          </p>

          <div className={styles.actionRow}>
            <button
              onClick={onDelete}
              className={styles.deleteBtn}
              disabled={selectedCount === 0}
            >
              清空
            </button>

            {!locked ? (
              !confirm ? (
                <button
                  onClick={() => setConfirm(true)}
                  className={styles.lockBtn}
                  disabled={!isComplete}
                >
                  锁定
                </button>
              ) : (
                <button
                  onClick={() => {
                    onLock();
                    setConfirm(false);
                  }}
                  className={styles.confirmLockBtn}
                >
                  确认锁定？
                </button>
              )
            ) : (
              <p className={styles.lockedText}>🔒 已锁定</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
