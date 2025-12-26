// BossMap/BossDropsController.tsx
"use client";

import React from "react";
import Drops from "./drops";
import type { ExtendedGroup } from "./types";

export default function BossDropsController(props: {
  scheduleId: string;
  localGroup: ExtendedGroup;
  selected: {
    floor: number;
    boss: string;
    dropList: string[];
    tradableList: string[];
    dropLevel: 9 | 10;
  } | null;
  status: "not_started" | "started" | "finished";
  onClose: () => void;
  onSave: (floor: number, data: any) => Promise<void>;
  onAfterReset: () => void;
  onMarkStarted: (floor?: number) => Promise<void>;
}) {
  const { scheduleId, localGroup, selected, status, onClose, onSave, onAfterReset, onMarkStarted } = props;

  if (!selected) return null;

  return (
    <Drops
      scheduleId={scheduleId}
      floor={selected.floor}
      boss={selected.boss}
      dropList={selected.dropList}
      tradableList={selected.tradableList}
      dropLevel={selected.dropLevel}
      group={localGroup}
      onClose={onClose}
      onSave={onSave}
      groupStatus={status}
      onMarkStarted={onMarkStarted}
      onAfterReset={onAfterReset}
    />
  );
}
