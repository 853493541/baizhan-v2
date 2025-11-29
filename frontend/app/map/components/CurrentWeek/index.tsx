"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import MapRow from "../MapRow";

interface Props {
  row1: number[];
  row2: number[];
  floorAssignments: Record<number, string>;
  onSelect: (floor: number, boss: string) => void;
  getAvailableBosses: (floor: number) => string[];
  onDelete: () => void;
  status: "idle" | "saving" | "success" | "error";
  locked: boolean;     // initial locked state from backend
  onLock: () => void;  // backend lock API
}

export default function CurrentWeek({
  row1,
  row2,
  floorAssignments,
  onSelect,
  getAvailableBosses,
  onDelete,
  status,
  locked: backendLocked,
  onLock,
}: Props) {

  /** 🔓 Local lock state — allows frontend unlock */
  const [locked, setLocked] = useState(backendLocked);

  /** Sync backend lock → local lock ONLY on first load */
  useEffect(() => {
    setLocked(backendLocked);
  }, [backendLocked]);

  const totalFloors = row1.length + row2.length;
  const selectedCount = Object.keys(floorAssignments).length;
  const isComplete = row1.concat(row2).every((f) => floorAssignments[f]);

  /** 🔒 Lock and freeze */
  const handleLock = async () => {
    await onLock();
    setLocked(true);
  };

  /** 🔓 Unlock (frontend ONLY — keeps all selections) */
  const handleUnlock = () => {
    console.log("🔓 Frontend unlock — selections stay the same");
    setLocked(false);
  };

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>本周地图</h1>

      <MapRow
        floors={row1}
        floorAssignments={floorAssignments}
        readonly={locked}
        onSelect={onSelect}
        getAvailableBosses={getAvailableBosses}
      />

      <MapRow
        floors={row2}
        floorAssignments={floorAssignments}
        readonly={locked}
        onSelect={onSelect}
        getAvailableBosses={getAvailableBosses}
      />

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
            disabled={locked || selectedCount === 0}
          >
            清空
          </button>

          {/* 🔒 Locked → show Unlock button */}
          {locked ? (
            <button className={styles.unlockBtn} onClick={handleUnlock}>
              解锁
            </button>
          ) : (
            <button
              className={styles.lockBtn}
              disabled={!isComplete}
              onClick={handleLock}
            >
              锁定
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
