"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

type Props = {
  name: string;
  description?: string;
  remainingTurns: number;
  anchorRect: DOMRect;
  sourceCardName?: string;
};

export default function StatusHint({
  name,
  description,
  remainingTurns,
  anchorRect,
  sourceCardName,
}: Props) {
  /* =========================================================
     RE-ANCHOR STRATEGY (NO MAGIC NUMBERS)
     - Measure actual hint size after render
     - Prefer TOP-RIGHT of pill
     - Flip / clamp if needed
  ========================================================= */

  const hintRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!hintRef.current) return;

    const rect = hintRef.current.getBoundingClientRect();
    const GAP = 8;

    let top = anchorRect.top - rect.height - GAP;
    let left = anchorRect.right + GAP;

    /* not enough space above → place below */
    if (top < GAP) {
      top = anchorRect.bottom + GAP;
    }

    /* clamp horizontally */
    const maxLeft = window.innerWidth - rect.width - GAP;
    left = Math.min(Math.max(GAP, left), maxLeft);

    /* clamp vertically */
    const maxTop = window.innerHeight - rect.height - GAP;
    top = Math.min(Math.max(GAP, top), maxTop);

    setPos({ top, left });
  }, [anchorRect, name, remainingTurns, sourceCardName, description]);

  return (
    <div
      ref={hintRef}
      key={`${name}-${remainingTurns}-${anchorRect.top}-${anchorRect.left}`}
      className={styles.statusHint}
      style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
    >
      {/* HEADER: NAME + SOURCE */}
      <div className={styles.hintHeader}>
        <div className={styles.hintName}>{name}</div>

        {sourceCardName && (
          <div className={styles.hintSourceInline}>
            来源：{sourceCardName}
          </div>
        )}
      </div>

      <div className={styles.hintDivider} />

      <div className={styles.hintDesc}>
        {description}
      </div>

      <div className={styles.hintDivider} />

      {/* FOOTER: REMAINING TURNS */}
      <div className={styles.hintTurnsFooter}>
        剩余回合：{Math.max(1, remainingTurns)}
      </div>
    </div>
  );
}
