"use client";

import React from "react";
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
  ],
  purple: ["冯度", "鬼影小次郎", "方宇谦", "谢云流"],
  blue: ["恶战", "陆寻", "韦柔丝", "武雪散"],
  green: ["肖童", "程沐华", "悉达罗摩"],
  red: ["罗翼", "源明雅", "司徒一一", "阿依努尔", "萧沙", "牡丹"],
} as const;

const COLUMN_META = [
  { key: "yellow" as const, label: "黄", className: styles.colYellow },
  { key: "purple" as const, label: "紫", className: styles.colPurple },
  { key: "blue" as const, label: "蓝", className: styles.colBlue },
  { key: "red" as const, label: "红", className: styles.colRed },
  { key: "green" as const, label: "绿", className: styles.colGreen },
];

interface Props {
  floor: number;
  pool: string[];
  floorAssignments: Record<number, string>;
  onClose: () => void;
  onPick: (floor: number, boss: string) => void;
}

export default function BossSelectModal({
  floor,
  pool,
  floorAssignments,
  onClose,
  onPick,
}: Props) {
  const poolSet = new Set(pool);

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>{floor} 层</div>

          {/* Close button */}
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

        {/* Columns */}
        <div className={styles.columns}>
          {COLUMN_META.map((col) => {
            const bosses = GROUPS[col.key].filter((b) => poolSet.has(b));

            return (
              <div key={col.key} className={clsx(styles.column, col.className)}>
                <div className={styles.columnHeader}>{col.label}</div>

                <div className={styles.bossList}>
                  {bosses.map((boss) => {
                    const assigned = Object.entries(floorAssignments).find(
                      ([, b]) => b === boss
                    );
                    const assignedFloor = assigned
                      ? Number(assigned[0])
                      : null;

                    const isSelected = assignedFloor != null;

                    return (
                      <button
                        key={boss}
                        className={clsx(
                          styles.bossItem,
                          isSelected && styles.bossBtnAssigned
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPick(floor, boss);
                        }}
                      >
                        <div className={styles.bossName}>{boss}</div>

                        {isSelected && (
                          <span className={styles.badgeSelected}>已选</span>
                        )}
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
