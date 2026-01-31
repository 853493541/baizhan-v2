"use client";

import styles from "../styles.module.css";

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
     POSITIONING RULES
     - Prefer TOP-RIGHT of the hovered pill
     - Keep on screen (clamp)
  ========================================================= */

  const GAP = 8;                 // space from pill
  const EST_WIDTH = 260;         // hint width (phone-safe estimate)
  const EST_HEIGHT = 160;        // hint height estimate

  let top = anchorRect.top - EST_HEIGHT - GAP;
  let left = anchorRect.right + GAP;

  /* If not enough space above → place below */
  if (top < 8) {
    top = anchorRect.bottom + GAP;
  }

  /* Clamp horizontally */
  const maxLeft = window.innerWidth - EST_WIDTH - 8;
  left = Math.min(Math.max(8, left), maxLeft);

  /* Clamp vertically */
  const maxTop = window.innerHeight - EST_HEIGHT - 8;
  top = Math.min(Math.max(8, top), maxTop);

  return (
    <div
      key={`${name}-${remainingTurns}-${anchorRect.top}-${anchorRect.left}`}
      className={styles.statusHint}
      style={{ top, left }}
    >
      <div className={styles.hintHeader}>
        <div className={styles.hintName}>{name}</div>
        <div className={styles.hintTurnsPlain}>
          剩余回合：{Math.max(1, remainingTurns)}
        </div>
      </div>

      <div className={styles.hintDivider} />

      <div className={styles.hintDesc}>
        {description}
      </div>

      <div className={styles.hintDivider} />

      {sourceCardName && (
        <div className={styles.hintSource}>
          来源：{sourceCardName}
        </div>
      )}
    </div>
  );
}
