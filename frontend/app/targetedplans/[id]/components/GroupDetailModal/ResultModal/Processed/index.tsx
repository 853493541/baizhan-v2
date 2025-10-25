"use client";
import React from "react";
import styles from "./styles.module.css";
import type { AssignedDrop } from "../index";
import type { GroupResult } from "@/utils/solver";

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function Processed({ drops, group }: { drops: AssignedDrop[]; group: GroupResult }) {
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

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已处理</h3>

      {(!drops || drops.length === 0) ? (
        <div className={styles.emptyBox}>暂无处理记录</div>
      ) : (
        Object.entries(
          drops.reduce((acc: Record<string, AssignedDrop[]>, d: AssignedDrop) => {
            if (!acc[d.char]) acc[d.char] = [];
            acc[d.char].push(d);
            return acc;
          }, {})
        ).map(([charName, list]) => {
          const charRole = list[0]?.role;
          const sortedList = [...list].sort((a, b) => {
            const order = { 9: 1, 10: 2 };
            return (order[a.level] || 99) - (order[b.level] || 99);
          });

          return (
            <div key={charName} className={styles.charSection}>
              <span className={`${styles.charBubble} ${getRoleColorClass(charRole)}`}>{charName}</span>
              <ul className={styles.assignmentList}>
                {sortedList.map((a, i) => (
                  <li key={i} className={styles.assignmentItem}>
                    <div className={styles.leftContent}>
                      <img
                        src={getAbilityIcon(a.ability)}
                        alt={a.ability}
                        className={styles.assignmentIcon}
                      />
                      <span className={styles.assignmentText}>
                        {a.level === 9 ? "九重" : a.level === 10 ? "十重" : ""} · {a.ability}
                      </span>
                      <span className={`${styles.badge} ${styles[a.status || "saved"]}`}>
                        {a.status === "used"
                          ? "已使用"
                          : a.status === "saved"
                          ? "已存入"
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
        })
      )}
    </div>
  );
}
