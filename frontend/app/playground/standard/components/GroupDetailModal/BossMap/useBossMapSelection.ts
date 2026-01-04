// BossMap/useBossMapSelection.ts
"use client";

import { useState } from "react";

export function useBossMapSelection() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selected, setSelected] = useState<{
    floor: number;
    boss: string;
    dropList: string[];
    tradableList: string[];
    dropLevel: 9 | 10;
    mode?: "primary" | "secondary";
  } | null>(null);

  const [bossModal, setBossModal] = useState<{
    floor: 90 | 100;
    currentBoss?: string;
  } | null>(null);

  const handleSelectBossCard = (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: 9 | 10
  ) =>
    setSelected({
      floor,
      boss,
      dropList,
      tradableList,
      dropLevel,
      mode: "primary",
    });

  const handleSelectSecondaryDrop = (
    floor: number,
    boss: string,
    dropList: string[],
    dropLevel: 9 | 10
  ) =>
    setSelected({
      floor,
      boss,
      dropList,
      tradableList: [],
      dropLevel,
      mode: "secondary",
    });

  return {
    selected,
    bossModal,
    confirmOpen,

    setSelected,
    setBossModal,
    setConfirmOpen,

    handleSelectBossCard,
    handleSelectSecondaryDrop,
  };
}
