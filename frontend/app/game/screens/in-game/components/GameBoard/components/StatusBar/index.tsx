"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import StatusHint from "./Hint";

import { useGamePreload } from "../../../../preload/GamePreloadContext";
import type { ActiveBuff } from "@/app/game/screens/in-game/types";

/* ================= TYPES ================= */

type Props = {
  buffs?: ActiveBuff[];
  currentTurn?: number;
};

type ResolvedBuff = {
  buffId: number;
  name: string;
  category: "BUFF" | "DEBUFF";
  description?: string;
  remainingTurns: number;
  isLastTurn: boolean;
  sourceCardName?: string;
};

type ActiveHint = {
  name: string;
  description?: string;
  remainingTurns: number;
  rect: DOMRect;
  sourceCardName?: string;
};

/* ================= COMPONENT ================= */

export default function StatusBar({ buffs = [], currentTurn = 0 }: Props) {
  const preload = useGamePreload();
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);

  const resolved: ResolvedBuff[] = buffs
    .map((b) => {
      const meta = preload.buffMap[b.buffId];
      if (!meta) return null;

      const remainingTurns = Math.max(0, b.expiresAtTurn - currentTurn);

      return {
        buffId: b.buffId,
        name: meta.name,
        category: meta.category,
        // ✅ USE BACKEND DESCRIPTION (preload) — DO NOT REBUILD FROM effects
        description: meta.description ?? "无",
        remainingTurns,
        isLastTurn: remainingTurns <= 1,
        sourceCardName: meta.sourceCardName,
      };
    })
    .filter(Boolean) as ResolvedBuff[];

  const positive = resolved.filter((b) => b.category === "BUFF");
  const negative = resolved.filter((b) => b.category !== "BUFF");

  function openHint(e: React.MouseEvent<HTMLDivElement>, b: ResolvedBuff) {
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
          {positive.slice(0, 6).map((b) => (
            <div
              key={`buff-${b.buffId}`}
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
          {negative.slice(0, 6).map((b) => (
            <div
              key={`debuff-${b.buffId}`}
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
