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

    onSelectSecondary?: (
    floor: number,
    boss: string,
    dropList: string[],
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
    onSelectSecondary, 
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
        const boss = resolveBoss(f);

        const hasPrimaryDrop =
          !!kill?.selection &&
          !kill.selection.noDrop &&
          !!kill.selection.ability;

        const hasSecondaryDrop = !!kill?.secondarySelection;

        const isSpecialFloor = f === 90 || f === 100;

        const isMutatableBoss = [
          "肖红",
          "青年程沐华",
          "困境韦柔丝",
        ].includes(boss);

        const allowSecondaryDrop =
          !!onAddSecondaryDrop &&
          !!kill &&
          hasPrimaryDrop &&
          !hasSecondaryDrop &&
          (isSpecialFloor || isMutatableBoss);

        console.log("[BossRows -> floor]", {
          floor: f,
          boss,
          hasKill: !!kill,
          hasPrimaryDrop,
          hasSecondaryDrop,
          isSpecialFloor,
          isMutatableBoss,
          allowSecondaryDrop,
        });

        return (
          <BossCard
            key={f}
            floor={f}
            boss={boss}
            group={localGroup}
            bossData={bossData}
            highlightAbilities={highlightAbilities}
            tradableSet={tradableSet}
            kill={kill}
            activeMembers={activeMembers}
            onSelect={onSelect}
             onSelectSecondary={onSelectSecondary}
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
            // ➕ PASS THROUGH ONLY WHEN ALLOWED
            onAddSecondaryDrop={
              allowSecondaryDrop
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
