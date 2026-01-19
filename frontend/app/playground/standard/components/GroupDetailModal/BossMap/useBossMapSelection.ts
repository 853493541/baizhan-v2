// BossMap/useBossMapSelection.ts
"use client";

import { useState } from "react";

type DropLevel = 9 | 10;

/* ======================================================
   🧬 MUTATION → DOWNGRADED BOSS MAP
   (authoritative for secondary drops)
====================================================== */
const MUTATION_DOWNGRADE_MAP: Record<string, string> = {
  "困境韦柔丝": "韦柔丝",
  "青年程沐华": "程沐华",
  "肖红·变异": "肖红",
};

export type BossMapSelected =
  | {
      mode: "primary";
      floor: number;
      boss: string;
      dropList: string[];
      tradableList: string[];
      dropLevel: DropLevel;
    }
  | {
      mode: "secondary";
      floor: number;
      boss: string;
      dropList: string[];
      tradableList: string[];
      dropLevel: DropLevel;
    };

export function useBossMapSelection() {
  const [selected, setSelected] = useState<BossMapSelected | null>(null);

  const [bossModal, setBossModal] = useState<{
    floor: 90 | 100;
    currentBoss: string;
  } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  /* =========================
     PRIMARY — unchanged
  ========================= */
  const handleSelectBossCard = (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: DropLevel
  ) => {
    setSelected({
      mode: "primary",
      floor,
      boss,
      dropList,
      tradableList,
      dropLevel,
    });
  };

  /* =========================
     SECONDARY — 🔥 FIX HERE
     Mutated boss → downgraded boss
  ========================= */
  const handleSelectSecondaryDrop = (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: DropLevel
  ) => {
    const downgradedBoss =
      MUTATION_DOWNGRADE_MAP[boss] ?? boss;

    // 🔍 minimal targeted debug
    console.log("[downg][select-secondary]", {
      floor,
      originalBoss: boss,
      downgradedBoss,
      downgradeApplied: boss !== downgradedBoss,
    });

    setSelected({
      mode: "secondary",
      floor,
      boss: downgradedBoss,
      dropList,
      tradableList,
      dropLevel,
    });
  };

  return {
    selected,
    setSelected,

    bossModal,
    setBossModal,

    confirmOpen,
    setConfirmOpen,

    handleSelectBossCard,
    handleSelectSecondaryDrop,
  };
}
