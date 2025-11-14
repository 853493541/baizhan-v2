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
                {g.characters.map((c) => (
                  <li
                    key={c._id}
                    className={`${styles.memberItem} ${
                      c.role === "Tank"
                        ? styles.tank
                        : c.role === "Healer"
                        ? styles.healer
                        : styles.dps
                    }`}
                  >
                    {MAIN_CHARACTERS.has(c.name) ? "★ " : ""}
                    {c.name}
                  </li>
                ))}
              </ul>

              {qaWarnings.length > 0 && (
                <div className={styles.groupViolation}>
                  {qaWarnings.map((w, idx) => (
                    <p key={idx}>⚠️ {w}</p>
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
