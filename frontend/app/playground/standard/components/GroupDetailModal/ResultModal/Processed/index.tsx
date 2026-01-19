"use client";
import React from "react";
import styles from "./styles.module.css";
import type { AssignedDrop } from "../index";
import type { GroupResult } from "@/utils/solver";

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function Processed({
  drops,
  group,
}: {
  drops: AssignedDrop[];
  group: GroupResult;
}) {
  const getRoleColorClass = (role?: string) => {
    switch (role) {
      case "Tank":
        return styles.tank;
      case "DPS":
        return styles.dps;
      case "Healer":
        return styles.healer;
      default:
        return "";
    }
  };

  const grouped = Object.entries(
    drops.reduce((acc: Record<string, AssignedDrop[]>, d) => {
      if (!acc[d.char]) acc[d.char] = [];
      acc[d.char].push(d);
      return acc;
    }, {})
  );

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已处理</h3>

      {grouped.length === 0 ? (
        <div className={styles.emptyBox}>暂无处理记录</div>
      ) : (
        <div className={styles.rowsGrid}>
          {grouped.map(([charName, list], idx) => {
            const charRole = list[0]?.role;
            const isLastChar = idx === grouped.length - 1;

            const sortedList = [...list].sort((a, b) => {
              const order = { 9: 1, 10: 2 };
              return (order[a.level] || 99) - (order[b.level] || 99);
            });

            return (
              <div
                key={charName}
                className={styles.charRow}
                data-last={isLastChar ? "true" : "false"}
              >
                {/* character column */}
                <div className={styles.charCol}>
                  <span
                    className={`${styles.charBubble} ${getRoleColorClass(
                      charRole
                    )}`}
                    title={charName}
                  >
                    {charName.slice(0, 4)}
                  </span>
                </div>

                {/* abilities column */}
                <ul
                  className={`${styles.assignmentList} ${
                    isLastChar ? styles.lastChar : ""
                  }`}
                >
                  {sortedList.map((a) => (
                    <li
                      key={`${a.floor}-${a.slot}-${a.ability}`}
                      className={styles.assignmentItem}
                    >
                      <div className={styles.leftContent}>
                        <img
                          src={getAbilityIcon(a.ability)}
                          alt={a.ability}
                          className={styles.assignmentIcon}
                        />
                        <span className={styles.assignmentText}>
                          {a.level === 9
                            ? "九重"
                            : a.level === 10
                            ? "十重"
                            : ""}{" "}
                          · {a.ability}
                        </span>

                        <span
                          className={`${styles.badge} ${
                            styles[a.status || "saved"]
                          }`}
                        >
                          {a.status === "used"
                            ? "用"
                            : a.status === "saved"
                            ? "存"
                            : a.status === "assigned"
                            ? "已分配"
                            : "已处理"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
