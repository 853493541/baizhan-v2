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

// 🔍 helper for timestamped logs
const log = (msg: string, data?: any) => {
  const now = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${now}] [CurrentWeek] ${msg}`, data);
  } else {
    console.log(`[${now}] [CurrentWeek] ${msg}`);
  }
};

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

  // Check if all floors are filled (to allow lock)
  const isComplete = row1.concat(row2).every((f) => floorAssignments[f]);

  // 🔍 Debug logs on every render
  useEffect(() => {
    log("=== RENDER START ===");
    log("locked", locked);
    log("floorAssignments", floorAssignments);
    log("row1", row1);
    log("row2", row2);
    log("isComplete", isComplete);
    [...row1, ...row2].forEach((f) =>
      log(`Floor ${f} → boss:`, floorAssignments[f] || "未分配")
    );
    log("=== RENDER END ===");
  }, [locked, floorAssignments, row1, row2, isComplete]);

  // 🔹 Render helper for one row of floors
  const renderRow = (floors: number[]) => (
    <div className={styles.row}>
      {floors.map((floor) => {
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
                <option value="">-- 请选择 --</option>
                {getAvailableBosses(floor).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles.readonlyValue}>
                {boss || "未选择"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <section>
      <h1 className={styles.title}>本周地图</h1>

      {/* Top row */}
      {renderRow(row1)}

      {/* Bottom row */}
      {renderRow(row2)}

      {/* 🔒 Lock button / locked message */}
      {!locked ? (
        <>
          <button
            onClick={() => setConfirm(true)}
            className={styles.lockBtn}
            disabled={!isComplete}
          >
            锁定当前周地图
          </button>

          {confirm && (
            <div className={styles.confirmBox}>
              <p>确定要锁定吗？锁定后将无法修改，只能删除重来。</p>
              <div className={styles.confirmActions}>
                <button
                  onClick={() => {
                    onLock();
                    setConfirm(false);
                  }}
                  className={styles.confirmBtn}
                >
                  确认
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className={styles.cancelBtn}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className={styles.lockedText}>🔒 已锁定，不能修改</p>
      )}

      {/* Delete button */}
      <button onClick={onDelete} className={styles.deleteBtn}>
        删除当前周地图
      </button>

      {/* Status bar */}
      {status !== "idle" && (
        <div
          className={`${styles.status} ${
            status === "success"
              ? styles.success
              : status === "error"
              ? styles.error
              : styles.saving
          }`}
        >
          {status === "saving" && "💾 正在保存..."}
          {status === "success" && "✅ 保存成功"}
          {status === "error" && "❌ 保存失败"}
        </div>
      )}
    </section>
  );
}
