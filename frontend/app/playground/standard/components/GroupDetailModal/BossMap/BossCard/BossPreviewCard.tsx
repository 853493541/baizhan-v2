"use client";

import React, { useMemo } from "react";
import styles from "./styles.module.css";
import { calcBossNeeds } from "./calcBossNeeds";

interface Props {
  boss: string;
  floor: 90 | 100;
  bossData: Record<string, string[]>;
  group: any;
  activeMembers: number[];
  highlightAbilities: string[];
  selected: boolean;
  onSelect: (boss: string) => void;
}

export default function BossPreviewCard({
  boss,
  floor,
  bossData,
  group,
  activeMembers,
  highlightAbilities,
  selected,
  onSelect,
}: Props) {
  const dropLevel: 9 | 10 = floor === 90 ? 9 : 10;

  const needs = useMemo(() => {
    return calcBossNeeds({
      boss,
      bossData,
      group,
      activeMembers,
      dropLevel,
      highlightAbilities,
    });
  }, [boss, bossData, group, activeMembers, dropLevel, highlightAbilities]);

  return (
    <div
      className={`${styles.previewCard} ${selected ? styles.previewActive : ""}`}
      onClick={() => onSelect(boss)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.previewHeader}>{boss}</div>

      {needs.length > 0 ? (
        <ul className={styles.previewNeedList}>
          {needs.map((n) => (
            <li
              key={n.ability}
              className={n.isHighlight ? styles.coreHighlight : ""}
            >
              {n.ability} ({n.needCount})
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.noNeed}>无需求</div>
      )}
    </div>
  );
}
