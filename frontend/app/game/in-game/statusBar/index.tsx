"use client";

import styles from "./styles.module.css";
import { resolveBuff } from "./resolveBuff";

/* ================= TYPES ================= */

type Status = {
  type: string;
  value?: number;
  chance?: number;
  repeatTurns?: number;
  sourceCardId?: string;
  appliedAtTurn: number;
  expiresAtTurn: number;
};

type Props = {
  statuses?: Status[];
  currentTurn?: number;
};

export default function StatusBar({
  statuses = [],
  currentTurn = 0,
}: Props) {
  const resolved = statuses.map((s) => {
    const remainingTurns = Math.max(
      0,
      s.expiresAtTurn - currentTurn
    );

    const buff = resolveBuff({
      sourceCardId: s.sourceCardId,
      type: s.type,
      value: s.value,
      chance: s.chance,
      repeatTurns: s.repeatTurns,
      remainingTurns,
    });

    return {
      ...buff,
      category: buff.category,
      remainingTurns,
      isLastTurn: remainingTurns === 0, // 🔑 key flag
    };
  });

  const buffs = resolved.filter(b => b.category === "BUFF");
  const debuffs = resolved.filter(b => b.category !== "BUFF");

  return (
    <div className={styles.statusBar}>

      {/* Buff Row */}
      <div className={styles.statusRow}>
        {buffs.slice(0, 6).map((b, i) => (
          <div
            key={`buff-${i}`}
            className={`${styles.statusPill} ${styles.buff}`}
            title={b.description}
          >
            {b.name}

            <span
              className={`${styles.turnBadge} ${
                b.isLastTurn ? styles.lastTurn : ""
              }`}
            >
              {Math.max(1, b.remainingTurns)}
            </span>
          </div>
        ))}
      </div>

      {/* Debuff Row */}
      <div className={styles.statusRow}>
        {debuffs.slice(0, 6).map((b, i) => (
          <div
            key={`debuff-${i}`}
            className={`${styles.statusPill} ${styles.debuff}`}
            title={b.description}
          >
            {b.name}

            <span
              className={`${styles.turnBadge} ${
                b.isLastTurn ? styles.lastTurn : ""
              }`}
            >
              {Math.max(1, b.remainingTurns)}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
