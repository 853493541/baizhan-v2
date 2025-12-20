"use client";
import React from "react";
import styles from "./styles.module.css";
import type { AssignedDrop } from "../index";
import type { GroupResult } from "@/utils/solver";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

interface Character {
  _id: string;
  name: string;
  abilities?: Record<string, number>;
  storage?: { ability: string; level: number; used?: boolean }[];
}

interface Props {
  drops: AssignedDrop[];
  group: GroupResult;
  onUse: (drop: AssignedDrop) => void;
  onStore: (drop: AssignedDrop) => void;
  loading?: string | null;
}

export default function Assigned({
  drops,
  group,
  onUse,
  onStore,
  loading,
}: Props) {
  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */
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

  const getLevelFromCharacter = (drop: AssignedDrop): number | null => {
    const char = drop.character as Character | undefined;
    if (!char?.abilities) return null;
    const raw = char.abilities[drop.ability];
    const parsed = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasLevel10InStorage = (drop: AssignedDrop): boolean => {
    const char = drop.character as Character | undefined;
    if (!char?.storage) return false;
    return char.storage.some(
      (i) => i.ability === drop.ability && i.level === 10 && i.used === false
    );
  };

  /* -------------------------------------------------------
     MAIN SINGLE-BUTTON FLOW
  ------------------------------------------------------- */
  const handleUseClick = async (drop: AssignedDrop) => {
    const currentLevel = getLevelFromCharacter(drop);

    // ---- pre-checks (unchanged) ----
    if (drop.level === 10 && (currentLevel ?? 0) < 9) {
      const ok = window.confirm(
        "数据显示该技能没有达到9重，是否直接修改该技能到10重？"
      );
      if (!ok) return;
    }

    if (drop.level === 9 && (currentLevel ?? 0) < 8) {
      const ok = window.confirm("是否消耗通本和这本书升级？");
      if (!ok) return;
    }

    // ---- STEP 1: always use the assigned drop ----
    await onUse(drop);

    // ---- STEP 2: optional add-on (storage) ----
    if (drop.level === 9 && hasLevel10InStorage(drop)) {
      const char = drop.character as Character | undefined;
      if (!char?._id) return;

      const confirmStorage = window.confirm(
        `已使用九重 ${drop.ability}。\n是否继续使用背包中的10重？`
      );
      if (!confirmStorage) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/characters/${char._id}/storage/use`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ability: drop.ability,
              level: 10,
            }),
          }
        );
        if (!res.ok) throw new Error(await res.text());
        alert(`✅ 已继续使用背包 ${drop.ability} 10重`);
      } catch (err) {
        console.error("❌ 使用背包10重失败:", err);
        alert("使用背包技能失败，请稍后再试。");
      }
    }
  };

  /* -------------------------------------------------------
     EMPTY
  ------------------------------------------------------- */
  if (!drops?.length) {
    return (
      <div className={styles.box}>
        <h3 className={styles.title}>已分配</h3>
        <div className={styles.emptyBox}>暂无分配</div>
      </div>
    );
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已分配</h3>

      {Object.entries(
        drops.reduce((acc: Record<string, AssignedDrop[]>, d) => {
          if (!acc[d.char]) acc[d.char] = [];
          acc[d.char].push(d);
          return acc;
        }, {})
      ).map(([charName, list]) => {
        const charRole = list[0]?.role;
        const sortedList = [...list].sort(
          (a, b) => ({ 9: 1, 10: 2 }[a.level] - ({ 9: 1, 10: 2 }[b.level]))
        );

        return (
          <div key={charName} className={styles.charSection}>
            <span
              className={`${styles.charBubble} ${getRoleColorClass(charRole)}`}
            >
              {charName}
            </span>

            <ul className={styles.assignmentList}>
              {sortedList.map((a, i) => {
                const currentLevel = getLevelFromCharacter(a);
                const has10 = a.level === 9 && hasLevel10InStorage(a);

                let warningText = "";
                let btnStyle = styles.useBtn;

                if (a.level === 9 && (currentLevel ?? 0) < 8) {
                  warningText = "未到8重";
                  btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                } else if (a.level === 10 && (currentLevel ?? 0) < 9) {
                  warningText = "未到9重";
                  btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                } else if (has10) {
                  warningText = "拥有10重";
                  btnStyle = `${styles.useBtn} ${styles.yellowBtn}`;
                }

                return (
                  <li key={i} className={styles.assignmentItem}>
                    <div className={styles.leftContent}>
                      <img
                        src={getAbilityIcon(a.ability)}
                        className={styles.assignmentIcon}
                      />
                      <span className={styles.assignmentText}>
                        {a.level === 9 ? "九重" : "十重"} · {a.ability}
                      </span>
                    </div>

                    <div className={styles.rightContent}>
                      {warningText && (
                        <span className={styles.warning}>{warningText}</span>
                      )}
                      <button
                        disabled={loading === a.ability}
                        onClick={() => handleUseClick(a)}
                        className={btnStyle}
                      >
                        使用
                      </button>
                      <button
                        disabled={loading === a.ability}
                        onClick={() => onStore(a)}
                        className={styles.storeBtn}
                      >
                        存入
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
