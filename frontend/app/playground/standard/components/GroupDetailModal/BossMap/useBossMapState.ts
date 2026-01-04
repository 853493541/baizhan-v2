// BossMap/useBossMapState.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExtendedGroup } from "./types";
import { useBossAdjustments } from "./useBossAdjustments";

type Status = "not_started" | "started" | "finished";

export function useBossMapState(args: {
  scheduleId: string;
  group: ExtendedGroup;
  weeklyMap: Record<number, string>;
  onRefresh?: () => void;
  onGroupUpdate?: (g: ExtendedGroup) => void;
}) {
  const { scheduleId, group, weeklyMap, onRefresh, onGroupUpdate } = args;

  const [localGroup, setLocalGroup] = useState<ExtendedGroup>(group);
  const lastLocalUpdate = useRef(Date.now());

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

  /* ================= boss resolving ================= */
  const { resolveBoss } = useBossAdjustments(localGroup, weeklyMap);

  /* ================= mutation toggle ================= */
  const toggleMutationFloor = async (floor: number) => {
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/finish`,
      { method: "POST" }
    );
  };

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

  /* ================= sync ================= */
  useEffect(() => {
    const parentKills = group.kills?.length || 0;
    const localKills = localGroup.kills?.length || 0;

    if (
      parentKills >= localKills ||
      Date.now() - lastLocalUpdate.current > 3000
    ) {
      setLocalGroup(group);
    }
  }, [group, localGroup.kills]);

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
  }, [scheduleId, localGroup.index]);

  return {
    localGroup,
    setLocalGroup,

    status,
    statusLabel,

    resolveBoss,
    toggleMutationFloor,

    updateGroupKill,
    markGroupStartedTime,
    markGroupFinishedTime,
    updateGroupStatus,
  };
}
