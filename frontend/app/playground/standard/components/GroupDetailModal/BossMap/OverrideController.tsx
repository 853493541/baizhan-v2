// BossMap/BossOverrideController.tsx
"use client";

import React from "react";
import SelectionModal from "./BossCard/SelectionModal";
import type { ExtendedGroup } from "./types";

interface Props {
  scheduleId: string;
  groupIndex: number;

  // modal state
  bossModal: {
    floor: 90 | 100;
    currentBoss?: string;
  } | null;

  // data needed by SelectionModal
  group: ExtendedGroup;
  bossData: Record<string, string[]>;
  highlightAbilities: string[];

  onClose: () => void;
  onSuccess: (newBoss: string) => void;
}

export default function BossOverrideController({
  scheduleId,
  groupIndex,
  bossModal,
  group,
  bossData,
  highlightAbilities,
  onClose,
  onSuccess,
}: Props) {
  if (!bossModal) return null;

  return (
    <SelectionModal
      scheduleId={scheduleId}
      groupIndex={groupIndex}
      floor={bossModal.floor}
      currentBoss={bossModal.currentBoss}
      group={group}
      bossData={bossData}
      highlightAbilities={highlightAbilities}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
