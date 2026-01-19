// BossMap/useBossMapController.ts
"use client";

import { useState } from "react";
import type { ExtendedGroup } from "./types";
import { useBossMapState } from "./useBossMapState";
import { useBossMapSelection } from "./useBossMapSelection";

export function useBossMapController(args: {
  scheduleId: string;
  group: ExtendedGroup;
  weeklyMap: Record<number, string>;
  onRefresh?: () => void;
  onGroupUpdate?: (g: ExtendedGroup) => void;
}) {
  const state = useBossMapState(args);
  const selection = useBossMapSelection();

  const [activeMembers, setActiveMembers] = useState<number[]>([0, 1, 2]);
  const toggleMember = (i: number) =>
    setActiveMembers((p) =>
      p.includes(i) ? p.filter((x) => x !== i) : [...p, i]
    );

  const closeDrops = () => selection.setSelected(null);

  const onDropsSave = async (floor: number, data: any) => {
    const sel = selection.selected;
    if (!sel) return;

    if (sel.mode === "secondary") {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${args.scheduleId}/groups/${state.localGroup.index}/floor/${floor}/secondary-drop`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selection: data }),
        }
      );
    } else {
      await state.updateGroupKill(floor, sel.boss, data);

      if (state.status === "not_started" && floor !== 100) {
        await state.markGroupStartedTime();
        await state.updateGroupStatus("started");
      }
    }

    selection.setSelected(null);
    args.onRefresh?.();
  };

  const onAfterReset = () => {
    const floor = selection.selected?.floor;
    if (!floor) return;

    state.setLocalGroup((prev) => ({
      ...prev,
      kills: prev.kills?.filter((k) => k.floor !== floor) || [],
    }));

    selection.setSelected(null);
    args.onRefresh?.();
  };

  const openBossModal = (floor: 90 | 100) =>
    selection.setBossModal({
      floor,
      currentBoss: state.resolveBoss(floor),
    });

  const closeBossModal = () => selection.setBossModal(null);

  const onBossOverrideSuccess = (boss: string) => {
    const modal = selection.bossModal;
    if (!modal) return;

    state.setLocalGroup((prev) => ({
      ...prev,
      ...(modal.floor === 90 && { adjusted90: boss }),
      ...(modal.floor === 100 && { adjusted100: boss }),
    }));

    selection.setBossModal(null);
    args.onRefresh?.();
  };

  const handleFinish = () => selection.setConfirmOpen(true);

  const cancelConfirm = () => selection.setConfirmOpen(false);

  const confirmFinish = async () => {
    selection.setConfirmOpen(false);
    await state.markGroupFinishedTime();
    await state.updateGroupStatus("finished");
  };
const createSecondarySlot = async (floor: number) => {
  await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${args.scheduleId}/groups/${state.localGroup.index}/floor/${floor}/secondary-drop`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection: {} }),
    }
  );

  args.onRefresh?.();
};

  return {
    localGroup: state.localGroup,
    selected: selection.selected,
    bossModal: selection.bossModal,
    activeMembers,
    confirmOpen: selection.confirmOpen,
    status: state.status,
    statusLabel: state.statusLabel,

    toggleMember,
    resolveBoss: state.resolveBoss,
    toggleMutationFloor: state.toggleMutationFloor,

    handleSelectBossCard: selection.handleSelectBossCard,
    handleSelectSecondaryDrop: selection.handleSelectSecondaryDrop,

    openBossModal,
    closeBossModal,
    onBossOverrideSuccess,

    closeDrops,
    onDropsSave,
    onAfterReset,

    handleFinish,
    cancelConfirm,
    confirmFinish,
    createSecondarySlot,
  };
}
