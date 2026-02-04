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

      return {
        buffId: b.buffId,
        name: meta.name,
        category: meta.category,
        description: meta.effects
          ?.map((e: any) => {
            switch (e.type) {
              case "CONTROL":
                return "无法行动";
              case "SILENCE":
                return "无法使用卡牌";
              case "DAMAGE_MULTIPLIER":
                return `造成伤害提高 ${(e.value ?? 0) * 100}%`;
              case "DAMAGE_REDUCTION":
                return `受到伤害降低 ${(e.value ?? 0) * 100}%`;
              case "HEAL_REDUCTION":
                return `受到治疗降低 ${(e.value ?? 0) * 100}%`;
              case "UNTARGETABLE":
                return "无法被选中";
              case "STEALTH":
                return "隐身";
              case "DODGE_NEXT":
                return `下次闪避概率 +${Math.round(
                  (e.chance ?? 0) * 100
                )}%`;
              default:
                return e.type;
            }
          })
          .join("\n"),
        remainingTurns,
        isLastTurn: remainingTurns <= 1,
        sourceCardName: meta.sourceCardName,
      };
    })
    .filter(Boolean) as ResolvedBuff[];

  const positive = resolved.filter((b) => b.category === "BUFF");
  const negative = resolved.filter((b) => b.category !== "BUFF");

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
