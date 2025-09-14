"use client";

import styles from "./styles.module.css";
import { GroupResult, Character, AbilityCheck } from "@/utils/solver";

interface Props {
  schedule: {
    _id: string;
    conflictLevel: number;
    checkedAbilities: AbilityCheck[];
    characters: Character[];
  };
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  activeIdx: number | null;
  setActiveIdx: (idx: number | null) => void;
  checkGroupQA: (
    group: GroupResult,
    conflictLevel: number,
    checkedAbilities: AbilityCheck[]
  ) => string[];
}

export default function MainSection({
  schedule,
  groups,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  return (
    <div className={styles.section}>
      <h3>排表区域</h3>
      {groups.length === 0 ? (
        <p>暂无排表结果</p>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((g, idx) => {
            const qaWarnings = checkGroupQA(
              g,
              schedule.conflictLevel,
              schedule.checkedAbilities
            );
            return (
              <div
                key={idx}
                className={styles.groupCard}
                onClick={() => setActiveIdx(idx)}
              >
                <h4 className={styles.groupTitle}>Group {idx + 1}</h4>
                <ul className={styles.memberList}>
                  {g.characters.map((c) => (
                    <li key={c._id} className={styles.memberItem}>
                      {c.name}
                    </li>
                  ))}
                </ul>
                {qaWarnings.length > 0 && (
                  <div className={styles.groupViolation}>
                    {qaWarnings.map((w, i) => (
                      <p key={i}>⚠️ {w}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
