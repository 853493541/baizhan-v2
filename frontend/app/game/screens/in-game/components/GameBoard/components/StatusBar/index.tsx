"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import { resolveBuff } from "./resolveBuff";
import StatusHint from "./Hint";

/* ================= TYPES ================= */

type Status = {
  type: string;
  value?: number;
  chance?: number;
  repeatTurns?: number;
  sourceCardId?: string;
  sourceCardName?: string;
  appliedAtTurn: number;
  expiresAtTurn: number;
};

type Props = {
  statuses?: Status[];
  currentTurn?: number;
};

type ActiveHint = {
  name: string;
  description?: string;
  remainingTurns: number;
  rect: DOMRect;
  sourceCardName?: string;
};

/* ================= COMPONENT ================= */

export default function StatusBar({
  statuses = [],
  currentTurn = 0,
}: Props) {
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);

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
      remainingTurns,
      isLastTurn: remainingTurns === 0,
      sourceCardName: s.sourceCardName,
    };
  });

  const buffs = resolved.filter(b => b.category === "BUFF");
  const debuffs = resolved.filter(b => b.category !== "BUFF");

  function openHint(
    e: React.MouseEvent<HTMLDivElement>,
    b: any
  ) {
    const rect = e.currentTarget.getBoundingClientRect();

    setActiveHint({
      name: b.name,
      description: b.description,
      remainingTurns: b.remainingTurns,
      rect,
      sourceCardName: b.sourceCardName,
    });
  }

  function closeHint() {
    setActiveHint(null);
  }

  return (
    <>
      <div className={styles.statusBar}>
        <div className={styles.statusRow}>
          {buffs.slice(0, 6).map((b, i) => (
            <div
              key={`buff-${i}`}
              className={`${styles.statusPill} ${styles.buff}`}
              onMouseEnter={(e) => openHint(e, b)}
              onMouseLeave={closeHint}
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

        <div className={styles.statusRow}>
          {debuffs.slice(0, 6).map((b, i) => (
            <div
              key={`debuff-${i}`}
              className={`${styles.statusPill} ${styles.debuff}`}
              onMouseEnter={(e) => openHint(e, b)}
              onMouseLeave={closeHint}
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

      {activeHint && (
        <StatusHint
          name={activeHint.name}
          description={activeHint.description}
          remainingTurns={activeHint.remainingTurns}
          anchorRect={activeHint.rect}
          sourceCardName={activeHint.sourceCardName}
        />
      )}
    </>
  );
}
