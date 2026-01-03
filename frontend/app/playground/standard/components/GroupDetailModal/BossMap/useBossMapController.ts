// BossMap/useBossMapController.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExtendedGroup } from "./types";
import { useBossAdjustments } from "./useBossAdjustments";

type Status = "not_started" | "started" | "finished";

export function useBossMapController(args: {
  scheduleId: string;
  group: ExtendedGroup;
  weeklyMap: Record<number, string>;
  onRefresh?: () => void;
  onGroupUpdate?: (g: ExtendedGroup) => void;
}) {
  const { scheduleId, group, weeklyMap, onRefresh, onGroupUpdate } = args;

  const [localGroup, setLocalGroup] = useState<ExtendedGroup>(group);
  const lastLocalUpdate = useRef(Date.now());

  /* ================= confirmation ================= */
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* ================= selection ================= */
  const [selected, setSelected] = useState<{
    floor: number;
    boss: string;
    dropList: string[];
    tradableList: string[];
    dropLevel: 9 | 10;
  } | null>(null);

  const [bossModal, setBossModal] = useState<{
    floor: 90 | 100;
    currentBoss?: string;
  } | null>(null);

  /* ================= active members ================= */
  const [activeMembers, setActiveMembers] = useState<number[]>([0, 1, 2]);
  const toggleMember = (i: number) =>
    setActiveMembers((p) =>
      p.includes(i) ? p.filter((x) => x !== i) : [...p, i]
    );

  /* ================= status ================= */
  const status = (localGroup.status ?? "not_started") as Status;

  const statusLabel = useMemo(
    () => ({
      not_started: "未开始",
      started: "进行中",
      finished: "已完成",
    }),
    []
  );

  /* ================= boss resolving (delegated) ================= */
  const { resolveBoss } = useBossAdjustments(localGroup, weeklyMap);

  /* ================= mutation toggle ================= */
  const toggleMutationFloor = async (floor: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/downgrade-floor`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ floor }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const updatedGroup: ExtendedGroup = data.group ?? localGroup;

      setLocalGroup(updatedGroup);
      lastLocalUpdate.current = Date.now();
      onGroupUpdate?.(updatedGroup);
    } catch (err) {
      console.error("❌ toggleMutationFloor error:", err);
    }
  };

  /* ================= lifecycle ================= */
  const markGroupStartedTime = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/start`,
      { method: "POST" }
    );
  };

  const markGroupFinishedTime = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/end`,
      { method: "POST" }
    );
  };

  /* ================= keep local in sync ================= */
  useEffect(() => {
    const parentKills = group.kills?.length || 0;
    const localKills = localGroup.kills?.length || 0;

    if (
      parentKills >= localKills ||
      Date.now() - lastLocalUpdate.current > 3000
    ) {
      setLocalGroup(group);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, localGroup.kills]);

  /* ================= group status ================= */
  const updateGroupStatus = async (next: Status) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      }
    );

    setLocalGroup((p) => ({ ...p, status: next }));
    onRefresh?.();
    onGroupUpdate?.({ ...localGroup, status: next });
  };

  /* ================= kills ================= */
  const updateGroupKill = async (
    floor: number,
    boss: string,
    selection: any
  ) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${floor}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boss, selection }),
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const newGroup: ExtendedGroup = {
      ...localGroup,
      kills: data.updatedGroup?.kills || localGroup.kills,
    };

    setLocalGroup(newGroup);
    lastLocalUpdate.current = Date.now();
    onRefresh?.();
    onGroupUpdate?.(newGroup);
  };

  /* ================= initial fetch ================= */
  useEffect(() => {
    const fetchKills = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/kills`
      );
      if (!res.ok) return;

      const data = await res.json();
      setLocalGroup((prev) => ({
        ...prev,
        kills: data.kills ?? prev.kills,
        status: data.status ?? prev.status,
      }));
    };

    fetchKills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, localGroup.index]);

  /* ================= UI handlers ================= */
  const handleFinish = () => setConfirmOpen(true);

  const handleSelectBossCard = (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: 9 | 10
  ) => setSelected({ floor, boss, dropList, tradableList, dropLevel });

  const closeDrops = () => setSelected(null);

  const onDropsSave = async (floor: number, data: any) => {
    if (!selected) return;

    await updateGroupKill(floor, selected.boss, data);
    setSelected(null);

    if (status === "not_started" && floor !== 100) {
      await markGroupStartedTime();
      await updateGroupStatus("started");
    }
  };

  const onAfterReset = () => {
    const floor = selected?.floor;
    if (!floor) return;

    setLocalGroup((prev) => ({
      ...prev,
      kills: prev.kills?.filter((k) => k.floor !== floor) || [],
    }));

    setSelected(null);
    onRefresh?.();
  };

  const openBossModal = (floor: 90 | 100) => {
    setBossModal({ floor, currentBoss: resolveBoss(floor) });
  };

  const closeBossModal = () => setBossModal(null);

  const onBossOverrideSuccess = (boss: string) => {
    if (!bossModal) return;

    setLocalGroup((prev) => ({
      ...prev,
      ...(bossModal.floor === 90 && { adjusted90: boss }),
      ...(bossModal.floor === 100 && { adjusted100: boss }),
    }));

    setBossModal(null);
    onRefresh?.();
  };

  const cancelConfirm = () => setConfirmOpen(false);

  const confirmFinish = async () => {
    setConfirmOpen(false);
    await markGroupFinishedTime();
    await updateGroupStatus("finished");
  };

  return {
    localGroup,
    selected,
    bossModal,
    activeMembers,
    confirmOpen,
    status,
    statusLabel,

    toggleMember,
    resolveBoss,
    toggleMutationFloor,

    handleSelectBossCard,
    setSelected,

    openBossModal,
    closeBossModal,
    onBossOverrideSuccess,

    closeDrops,
    onDropsSave,
    onAfterReset,

    handleFinish,
    cancelConfirm,
    confirmFinish,
  };
}
