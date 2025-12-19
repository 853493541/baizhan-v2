"use client";

import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

// ✅ hardcoded mains
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

interface Props {
  title: string;
  groups: {
    g: GroupResult & { status?: "not_started" | "started" | "finished" };
    i: number;
  }[];
  setActiveIdx: (i: number | null) => void;
  checkGroupQA: (
    group: GroupResult,
    conflictLevel: number,
    checkedAbilities: AbilityCheck[]
  ) => string[];
  conflictLevel: number;
  checkedAbilities: AbilityCheck[];
}

export default function DisplayGroups({
  title,
  groups,
  setActiveIdx,
  checkGroupQA,
  conflictLevel,
  checkedAbilities,
}: Props) {
  const renderStatus = (status?: string) => {
    const s = status || "not_started";
    const dotClass =
      s === "finished"
        ? styles.finished
        : s === "started"
        ? styles.started
        : styles.notStarted;
    const text = s === "finished" ? "完成" : s === "started" ? "进行中" : "未开始";

    return (
      <span className={`${styles.statusDot} ${dotClass}`}>
        ● <span className={styles.statusText}>{text}</span>
      </span>
    );
  };

  return (
    <>
      <h3 className={styles.sectionSubtitle}>{title}</h3>
      <div className={styles.groupsGrid}>
        {groups.map(({ g, i }) => {
          const qaWarnings = checkGroupQA(g, conflictLevel, checkedAbilities);

          // ✅ FRONTEND-ONLY: pick first main character (original order)
          const firstMainIndex = g.characters.findIndex((c) =>
            MAIN_CHARACTERS.has(c.name)
          );

          let orderedCharacters = g.characters;
          if (firstMainIndex !== -1) {
            const mainChar = g.characters[firstMainIndex];
            const rest = g.characters.filter(
              (_, idx) => idx !== firstMainIndex
            );
            orderedCharacters = [mainChar, ...rest];
          }

          return (
            <div
              key={i}
              className={`${styles.groupCard} ${
                qaWarnings.length > 0 ? styles.groupCardError : ""
              }`}
              onClick={() => setActiveIdx(i)}
            >
              <div className={styles.groupHeader}>
                <h4 className={styles.groupTitle}>组 {i + 1}</h4>
                {renderStatus(g.status)}
              </div>

              <ul className={styles.memberList}>
                {orderedCharacters.map((c, idx) => {
                  const isMain =
                    idx === 0 && MAIN_CHARACTERS.has(c.name);

                  return (
                    <li
                      key={c._id}
                      className={`${styles.memberItem} ${
                        isMain
                          ? styles.mainChar
                          : c.role === "Tank"
                          ? styles.tank
                          : c.role === "Healer"
                          ? styles.healer
                          : styles.dps
                      }`}
                    >
                      {isMain ? "★ " : ""}
                      {c.name}
                    </li>
                  );
                })}
              </ul>

              {qaWarnings.length > 0 && (
                <div className={styles.groupViolation}>
                  {qaWarnings.map((w, idx) => (
                    <p key={idx}>❌ {w}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
