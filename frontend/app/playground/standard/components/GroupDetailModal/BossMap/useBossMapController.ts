// BossMap/useBossMapController.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExtendedGroup } from "./types";

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
  const lastLocalUpdate = useRef<number>(Date.now());

  /* ================= confirmation state ================= */
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* ================= selection state ================= */
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

  /* ================= status helpers ================= */
  const status = (localGroup.status ?? "not_started") as Status;

  const statusLabel = useMemo(
    () => ({
      not_started: "未开始",
      started: "进行中",
      finished: "已完成",
    }),
    []
  );

  /* ================= resolve boss ================= */
  const resolveBoss = (floor: number) => {
    if (floor === 90 && localGroup.adjusted90) return localGroup.adjusted90;
    if (floor === 100 && localGroup.adjusted100) return localGroup.adjusted100;
    return weeklyMap[floor];
  };

  const applyAdjustedBossLocal = (floor: 90 | 100, boss: string) => {
    setLocalGroup((prev) => {
      const next = { ...prev };
      if (floor === 90) next.adjusted90 = boss;
      if (floor === 100) next.adjusted100 = boss;
      return next;
    });

    if (onGroupUpdate) {
      const next = { ...localGroup } as ExtendedGroup;
      if (floor === 90) next.adjusted90 = boss;
      if (floor === 100) next.adjusted100 = boss;
      onGroupUpdate(next);
    }
  };

  /* ================= NEW: mutation toggle ================= */
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

      const updatedGroup: ExtendedGroup =
        data.group ?? localGroup;

      setLocalGroup(updatedGroup);
      lastLocalUpdate.current = Date.now();
      onGroupUpdate?.(updatedGroup);
    } catch (err) {
      console.error("❌ toggleMutationFloor error:", err);
    }
  };

  /* ================= lifecycle timestamp helpers ================= */
  const markGroupStartedTime = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/start`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("❌ markGroupStartedTime error:", err);
    }
  };

  const markGroupFinishedTime = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/end`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("❌ markGroupFinishedTime error:", err);
    }
  };

  /* ================= keep local in sync ================= */
  useEffect(() => {
    const parentKillCount = group.kills?.length || 0;
    const localKillCount = localGroup.kills?.length || 0;

    if (
      parentKillCount >= localKillCount ||
      Date.now() - lastLocalUpdate.current > 3000
    ) {
      setLocalGroup(group);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, localGroup.kills]);

  /* ================= update group status ================= */
  const updateGroupStatus = async (next: Status) => {
    try {
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
    } catch (err) {
      console.error("❌ updateGroupStatus error:", err);
    }
  };

  /* ================= update kills ================= */
  const updateGroupKill = async (
    floor: number,
    boss: string,
    selection: any
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${floor}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boss, selection }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();

      const newGroup: ExtendedGroup = {
        ...localGroup,
        kills: updated.updatedGroup?.kills || localGroup.kills,
      };

      setLocalGroup(newGroup);
      lastLocalUpdate.current = Date.now();
      onRefresh?.();
      onGroupUpdate?.(newGroup);
    } catch (err) {
      console.error("❌ updateGroupKill error:", err);
    }
  };

  /* ================= instant fetch on open ================= */
  useEffect(() => {
    const instantFetch = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/kills`
        );
        if (!res.ok) return;

        const data = await res.json();
        const newGroup: ExtendedGroup = {
          ...localGroup,
          kills: data.kills || localGroup.kills,
          status: data.status || localGroup.status,
        };

        setLocalGroup(newGroup);
        lastLocalUpdate.current = Date.now();
        onGroupUpdate?.(newGroup);
      } catch (err) {
        console.error("❌ Instant fetch failed:", err);
      }
    };

    instantFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, localGroup.index]);

  /* ================= header / modal / drop handlers ================= */
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

  const onMarkStarted = async (floor?: number) => {
    if (typeof floor !== "number") return;
    if (status === "not_started" && floor !== 100) {
      await markGroupStartedTime();
      await updateGroupStatus("started");
    }
  };

  const onAfterReset = () => {
    const floorToRemove = selected?.floor;
    const newGroup: ExtendedGroup = {
      ...localGroup,
      kills:
        localGroup.kills?.filter((k) => k.floor !== floorToRemove) || [],
    };

    setLocalGroup(newGroup);
    onRefresh?.();
    onGroupUpdate?.(newGroup);
    setSelected(null);
  };

  const openBossModal = (floor: 90 | 100) => {
    setBossModal({
      floor,
      currentBoss: resolveBoss(floor),
    });
  };

  const closeBossModal = () => setBossModal(null);

  const onBossOverrideSuccess = (newBoss: string) => {
    if (!bossModal) return;
    applyAdjustedBossLocal(bossModal.floor, newBoss);
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
    // state
    localGroup,
    selected,
    bossModal,
    activeMembers,
    confirmOpen,
    status,
    statusLabel,

    // helpers
    toggleMember,
    resolveBoss,

    // mutation
    toggleMutationFloor,

    // selection
    handleSelectBossCard,
    setSelected,

    // boss override
    openBossModal,
    closeBossModal,
    onBossOverrideSuccess,

    // drops
    closeDrops,
    onDropsSave,
    onAfterReset,
    onMarkStarted,

    // lifecycle
    handleFinish,
    cancelConfirm,
    confirmFinish,
  };
}
