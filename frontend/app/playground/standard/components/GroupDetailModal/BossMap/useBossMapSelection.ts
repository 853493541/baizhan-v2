// BossMap/useBossMapSelection.ts
"use client";

import { useState } from "react";

type DropLevel = 9 | 10;

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
      tradableList: string[]; // ✅ FIX: secondary also carries tradables
      dropLevel: DropLevel;
    };

export function useBossMapSelection() {
  const [selected, setSelected] = useState<BossMapSelected | null>(null);

  const [bossModal, setBossModal] = useState<{
    floor: 90 | 100;
    currentBoss: string;
  } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // ✅ Primary: already had tradableList
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

  // ✅ FIX: Secondary must also accept/store tradableList
  const handleSelectSecondaryDrop = (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: DropLevel
  ) => {
    setSelected({
      mode: "secondary",
      floor,
      boss,
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
