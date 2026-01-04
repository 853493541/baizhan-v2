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

  // ⭐ mutation toggle (异)
  onToggleMutation?: (floor: number) => void;

  // ➕ secondary drop
  onAddSecondaryDrop?: (floor: number) => void;
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
    onAddSecondaryDrop,
  } = props;

  console.log("[BossRows] render", {
    floors,
    hasOnAddSecondaryDropProp: !!onAddSecondaryDrop,
  });

  return (
    <div className={styles.row}>
      {floors.map((f) => {
        const kill = localGroup.kills?.find((k) => k.floor === f);

        console.log("[BossRows -> floor]", {
          floor: f,
          boss: resolveBoss(f),
          hasKill: !!kill,
          rawSelection: kill?.selection,
          willPassAddSecondary: !!onAddSecondaryDrop,
        });

        return (
          <BossCard
            key={f}
            floor={f}
            boss={resolveBoss(f)}
            group={localGroup}
            bossData={bossData}
            highlightAbilities={highlightAbilities}
            tradableSet={tradableSet}
            kill={kill}
            activeMembers={activeMembers}
            onSelect={onSelect}
            onChangeBoss={
              onChangeBoss
                ? (floor) => {
                    console.log("[BossRows CLICK 换]", floor);
                    onChangeBoss(floor);
                  }
                : undefined
            }
            onToggleMutation={
              onToggleMutation
                ? (floor) => {
                    console.log("[BossRows CLICK 异]", floor);
                    onToggleMutation(floor);
                  }
                : undefined
            }
            // ➕ PASS THROUGH WITH LOG
            onAddSecondaryDrop={
              onAddSecondaryDrop
                ? (floor) => {
                    console.log("[BossRows CLICK +]", floor);
                    onAddSecondaryDrop(floor);
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
