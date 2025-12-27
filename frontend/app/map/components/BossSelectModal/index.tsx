"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import clsx from "clsx";

const GROUPS = {
  yellow: [
    "上衫勇刀",
    "华鹤炎",
    "秦雷",
    "钱宗龙",
    "钱南撰",
    "萧武宗",
    "阿基修斯",
    "提多罗吒",
    "卫栖梧",
    "迟驻",
    "拓跋思南",
  ],
  purple: ["冯度", "鬼影小次郎", "方宇谦", "谢云流", "青年谢云流"],
  blue: ["恶战", "陆寻", "韦柔丝", "武雪散", "公孙二娘"],
  green: ["肖童", "程沐华", "悉达罗摩"],
  red: ["罗翼", "源明雅", "司徒一一", "阿依努尔", "萧沙", "牡丹"],

  /* ⭐ NEW — Mutated / 异变 (yibian) */
  mutated: [
    "肖红",
    "青年程沐华",
    "困境韦柔丝",
  ],
} as const;

/* ========================================================
   COLUMN META (display only)
======================================================== */
const COLUMN_META = [
  { key: "yellow" as const, label: "黄", className: styles.colYellow },
  { key: "purple" as const, label: "紫", className: styles.colPurple },

  // ⭐ NEW COLUMN
  

  { key: "blue" as const, label: "蓝", className: styles.colBlue },
  { key: "red" as const, label: "红", className: styles.colRed },
  { key: "green" as const, label: "绿", className: styles.colGreen },
  { key: "mutated" as const, label: "异", className: styles.colMutated },
];

interface Props {
  floor: number;
  pool: string[];
  floorAssignments: Record<number, string>;
  onClose: () => void;
  onPick: (floor: number, boss: string) => void;
}

/* --------------------------------------------------------
   Pool group logic (unchanged)
-------------------------------------------------------- */
function inSamePoolGroup(f1: number, f2: number) {
  if (f1 >= 81 && f1 <= 89 && f2 >= 81 && f2 <= 89) return true;
  if (f1 >= 91 && f1 <= 99 && f2 >= 91 && f2 <= 99) return true;
  if (f1 === 90 && f2 === 90) return true;
  if (f1 === 100 && f2 === 100) return true;
  return false;
}

/* --------------------------------------------------------
   MOBILE-ONLY trimming
-------------------------------------------------------- */
function trimToTwoCN(name: string) {
  return name.slice(0, 2);
}

export default function BossSelectModal({
  floor,
  pool,
  floorAssignments,
  onClose,
  onPick,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile (match CSS breakpoint)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const poolSet = new Set(pool);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>{floor} 层</div>

          <button
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {/* Boss columns */}
        <div className={styles.columns}>
          {COLUMN_META.map((col) => {
            const bosses = GROUPS[col.key].filter((b) =>
              poolSet.has(b)
            );

            return (
              <div
                key={col.key}
                className={clsx(styles.column, col.className)}
              >
                <div className={styles.columnHeader}>
                  {col.label}
                </div>

                <div className={styles.bossList}>
                  {bosses.map((boss) => {
                    const assigned = Object.entries(
                      floorAssignments
                    ).find(
                      ([otherFloor, b]) =>
                        b === boss &&
                        inSamePoolGroup(
                          Number(otherFloor),
                          floor
                        )
                    );

                    const isSelected = Boolean(assigned);

                    return (
                      <button
                        key={boss}
                        className={clsx(
                          styles.bossItem,
                          isSelected &&
                            styles.bossBtnAssigned
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPick(floor, boss);
                        }}
                      >
                        {/* MOBILE ONLY: limit to two chars */}
                        <div className={styles.bossName}>
                          {isMobile
                            ? trimToTwoCN(boss)
                            : boss}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
