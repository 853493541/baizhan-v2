"use client";

import styles from "./styles.module.css";
import { resolveBuff } from "./resolveBuff";

/* ================= TYPES (MATCH BACKEND) ================= */

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
  statuses,
  currentTurn = 0,
}: Props) {
  if (!statuses || statuses.length === 0) return null;

  return (
    <div className={styles.statusBar}>
      {statuses.map((s, i) => {
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

        return (
          <div
            key={i}
            className={`${styles.statusPill} ${
              buff.category === "BUFF"
                ? styles.buff
                : styles.debuff
            }`}
            title={buff.description}
          >
            {buff.name}
          </div>
        );
      })}
    </div>
  );
}
