"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import StatusHint from "./Hint";

import { useGamePreload } from "../../../../preload/GamePreloadContext";
import type { ActiveBuff } from "@/app/game/screens/in-game/types";

type Props = {
  buffs?: ActiveBuff[];
  currentTurn?: number;

  /** optional — tooltip clamps to arena if provided */
  arenaRef?: React.RefObject<HTMLDivElement>;
};

type ResolvedBuff = {
  buffId: number;
  name: string;
  shortName: string;
  category: "BUFF" | "DEBUFF";
  description: string;
  remainingTurns: number;
  isLastTurn: boolean;
};

type ActiveHint = {
  name: string;
  description: string;
  remainingTurns: number;
  anchorRect: DOMRect;
};

export default function StatusBar({
  buffs = [],
  currentTurn = 0,
  arenaRef,
}: Props) {
  const preload = useGamePreload();
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);

  const resolved: ResolvedBuff[] = buffs
    .map((b) => {
      const meta = preload?.buffMap?.[b.buffId];
      if (!meta) return null;

      const remainingTurns = Math.max(0, b.expiresAtTurn - currentTurn);
      const shortName = meta.name.length > 2 ? meta.name.slice(0, 2) : meta.name;

      return {
        buffId: b.buffId,
        name: meta.name,
        shortName,
        category: meta.category,
        description: meta.description ?? "无",
        remainingTurns,
        isLastTurn: remainingTurns <= 1,
      };
    })
    .filter(Boolean) as ResolvedBuff[];

  const buffsPos = resolved.filter((b) => b.category === "BUFF");
  const buffsNeg = resolved.filter((b) => b.category === "DEBUFF");

  function openHint(anchorRect: DOMRect, b: ResolvedBuff) {
    setActiveHint({
      name: b.name,
      description: b.description,
      remainingTurns: b.remainingTurns,
      anchorRect,
    });
  }

  function closeHint() {
    setActiveHint(null);
  }

  function renderBuff(b: ResolvedBuff) {
    const colorClass = b.category === "BUFF" ? styles.buffText : styles.debuffText;

    return (
      <div key={b.buffId} className={styles.buffItem}>
        {/* NAME — DO NOT MOVE */}
        <div className={`${styles.buffName} ${colorClass}`}>{b.shortName}</div>

        {/* ICON — ONLY ANCHOR */}
        <div
          className={`${styles.buffIcon} ${
            b.category === "BUFF" ? styles.buffBorder : styles.debuffBorder
          }`}
          style={{
            backgroundImage: `url(/game/icons/buffs/${b.name}.png)`,
          }}
          onMouseEnter={(e) => openHint(e.currentTarget.getBoundingClientRect(), b)}
          onMouseLeave={closeHint}
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

  const arenaRect = arenaRef?.current
    ? arenaRef.current.getBoundingClientRect()
    : undefined;

  return (
    <>
      <div className={styles.statusBar}>
        <div className={styles.statusRow}>{buffsPos.slice(0, 6).map(renderBuff)}</div>
        <div className={styles.statusRow}>{buffsNeg.slice(0, 6).map(renderBuff)}</div>
      </div>

      {/* ✅ render tooltip whenever activeHint exists */}
      {activeHint && (
        <StatusHint
          name={activeHint.name}
          description={activeHint.description}
          remainingTurns={activeHint.remainingTurns}
          anchorRect={activeHint.anchorRect}
          arenaRect={arenaRect}
        />
      )}
    </>
  );
}
