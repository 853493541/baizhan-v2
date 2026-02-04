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
  shortName: string;
  category: "BUFF" | "DEBUFF";
  description: string;
  remainingTurns: number;
  isLastTurn: boolean;
  sourceCardName?: string;
};

type ActiveHint = {
  name: string;
  description: string;
  remainingTurns: number;
  rect: DOMRect;
  sourceCardName?: string;
};

/* ================= COMPONENT ================= */

export default function StatusBar({
  buffs = [],
  currentTurn = 0,
}: Props) {
  const preload = useGamePreload();
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);

  const resolved: ResolvedBuff[] = buffs
    .map((b) => {
      const meta = preload.buffMap[b.buffId];
      if (!meta) return null;

      const remainingTurns = Math.max(0, b.expiresAtTurn - currentTurn);
      const shortName =
        meta.name.length > 2 ? meta.name.slice(0, 2) : meta.name;

      return {
        buffId: b.buffId,
        name: meta.name,
        shortName,
        category: meta.category,
        description: meta.description ?? "无",
        remainingTurns,
        isLastTurn: remainingTurns <= 1,
        sourceCardName: meta.sourceCardName,
      };
    })
    .filter(Boolean) as ResolvedBuff[];

  const buffsPos = resolved.filter((b) => b.category === "BUFF");
  const buffsNeg = resolved.filter((b) => b.category === "DEBUFF");

  function openHint(
    e: React.MouseEvent<HTMLDivElement>,
    b: ResolvedBuff
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

  function renderBuff(b: ResolvedBuff) {
    const colorClass =
      b.category === "BUFF" ? styles.buffText : styles.debuffText;

    return (
      <div
        key={b.buffId}
        className={styles.buffItem}
        onMouseEnter={(e) => openHint(e, b)}
        onMouseLeave={closeHint}
      >
        {/* NAME */}
        <div className={`${styles.buffName} ${colorClass}`}>
          {b.shortName}
        </div>

        {/* ICON */}
        <div
          className={`${styles.buffIcon} ${
            b.category === "BUFF" ? styles.buffBorder : styles.debuffBorder
          }`}
          style={{
            backgroundImage: `url(/game/icons/Skills/${b.name}.png)`,
          }}
        />

        {/* TURNS */}
        <div
          className={`${styles.buffTurns} ${colorClass} ${
            b.isLastTurn ? styles.lastTurn : ""
          }`}
        >
          {Math.max(1, b.remainingTurns)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.statusBar}>
        <div className={styles.statusRow}>
          {buffsPos.slice(0, 6).map(renderBuff)}
        </div>

        <div className={styles.statusRow}>
          {buffsNeg.slice(0, 6).map(renderBuff)}
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
