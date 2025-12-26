// BossMap/BossOverrideController.tsx
"use client";

import React from "react";
import SelectionModal from "./BossCard/SelectionModal";

export default function BossOverrideController(props: {
  scheduleId: string;
  groupIndex: number;
  bossModal: { floor: 90 | 100; currentBoss?: string } | null;
  onClose: () => void;
  onSuccess: (newBoss: string) => void;
}) {
  const { scheduleId, groupIndex, bossModal, onClose, onSuccess } = props;

  if (!bossModal) return null;

  return (
    <SelectionModal
      scheduleId={scheduleId}
      groupIndex={groupIndex}
      floor={bossModal.floor}
      currentBoss={bossModal.currentBoss}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
