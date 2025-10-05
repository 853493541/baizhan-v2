"use client";
import React from "react";
import styles from "./styles.module.css";
import type { AssignedDrop } from "../index";
import type { GroupResult } from "@/utils/solver";

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function Assigned({ drops, group, onUse, onStore, loading }) {
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

  if (!drops?.length) return <p>暂无分配</p>;

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已分配</h3>

      {Object.entries(
        drops.reduce((acc: Record<string, AssignedDrop[]>, d: AssignedDrop) => {
          if (!acc[d.char]) acc[d.char] = [];
          acc[d.char].push(d);
          return acc;
        }, {})
      ).map(([charName, list]) => {
        const charRole = list[0]?.role;

        // ✅ Sort so that 九重 appears before 十重
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
                  </div>
                  <div className={styles.btnGroup}>
                    <button
                      disabled={loading === a.ability}
                      onClick={() => onUse(a)}
                      className={styles.useBtn}
                    >
                      使用
                    </button>
                    <button
                      disabled={loading === a.ability}
                      onClick={() => onStore(a)}
                      className={styles.storeBtn}
                    >
                      存入仓库
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
