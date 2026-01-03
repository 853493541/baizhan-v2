// BossMap/BossRows.tsx
"use client";

import React from "react";
import styles from "./styles.module.css";
import BossCard from "./BossCard";
import type { ExtendedGroup } from "./types";

export default function BossRows(props: {
  floors: number[];
  localGroup: ExtendedGroup;
  resolveBoss: (floor: number) => string;
  bossData: Record<string, string[]>;
  highlightAbilities: string[];
  tradableSet: Set<string>;
  activeMembers: number[];
  onSelect: (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: 9 | 10
  ) => void;

  // optional
  onChangeBoss?: (floor: 90 | 100) => void;

  // ⭐ NEW: mutation toggle (异)
  onToggleMutation?: (floor: number) => void;
}) {
  const {
    floors,
    localGroup,
    resolveBoss,
    bossData,
    highlightAbilities,
    tradableSet,
    activeMembers,
    onSelect,
    onChangeBoss,
    onToggleMutation,
  } = props;

  return (
    <div className={styles.row}>
      {floors.map((f) => (
        <BossCard
          key={f}
          floor={f}
          boss={resolveBoss(f)}
          group={localGroup}
          bossData={bossData}
          highlightAbilities={highlightAbilities}
          tradableSet={tradableSet}
          kill={localGroup.kills?.find((k) => k.floor === f)}
          activeMembers={activeMembers}
          onSelect={onSelect}
          onChangeBoss={
            onChangeBoss
              ? (floor) => onChangeBoss(floor)
              : undefined
          }
          // ⭐ pass mutation handler down
          onToggleMutation={
            onToggleMutation
              ? (floor) => onToggleMutation(floor)
              : undefined
          }
        />
      ))}
    </div>
  );
}
