import { useState, useEffect, useCallback } from "react";
import type { GroupResult } from "@/utils/solver";

export type GroupWithLifecycle = GroupResult & {
  startTime?: string | null;
  endTime?: string | null;

  adjusted90?: string | null;
  adjusted100?: string | null;

  downgradedFloors?: number[];
};

interface Params {
  scheduleId: string;
  groupIndex: number;
  initialGroup: GroupResult;
  onRefresh?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export function usePageSync({
  scheduleId,
  groupIndex,
  initialGroup,
  onRefresh,
}: Params) {
  const [groupData, setGroupData] =
    useState<GroupWithLifecycle>(initialGroup);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* -------------------------------------------------------
     🔁 Kills / status sync (guarded)
  ------------------------------------------------------- */
  const syncKills = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);

      const res = await fetch(
        `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${
          groupIndex + 1
        }/kills`
      );

      if (!res.ok) return;

      const data = await res.json();

      setGroupData((prev) => ({
        ...prev,
        kills: data.kills ?? prev.kills,
        status: data.status ?? prev.status,
        startTime: data.startTime ?? prev.startTime,
        endTime: data.endTime ?? prev.endTime,
      }));

      onRefresh?.();
    } catch (err) {
      console.error("❌ pageSync: kills sync failed", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [scheduleId, groupIndex, isRefreshing, onRefresh]);

  /* -------------------------------------------------------
     🔁 Adjusted boss sync (90 / 100)
  ------------------------------------------------------- */
  const syncAdjustedBoss = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${
          groupIndex + 1
        }/adjusted-boss`
      );

      if (!res.ok) return;

      const data = await res.json();

      setGroupData((prev) => ({
        ...prev,
        adjusted90: data.adjusted90 ?? prev.adjusted90,
        adjusted100: data.adjusted100 ?? prev.adjusted100,
      }));
    } catch (err) {
      console.error("❌ pageSync: adjusted boss sync failed", err);
    }
  }, [scheduleId, groupIndex]);

  /* -------------------------------------------------------
     🔁 Downgraded floors sync
  ------------------------------------------------------- */
  const syncDowngradedFloors = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${
          groupIndex + 1
        }/downgraded-floors`
      );

      if (!res.ok) return;

      const data = await res.json();

      setGroupData((prev) => ({
        ...prev,
        downgradedFloors:
          data.downgradedFloors ?? prev.downgradedFloors,
      }));
    } catch (err) {
      console.error("❌ pageSync: downgraded floors sync failed", err);
    }
  }, [scheduleId, groupIndex]);

  /* -------------------------------------------------------
     🔁 Combined sync tick
  ------------------------------------------------------- */
  const syncAll = useCallback(() => {
    syncKills();
    syncAdjustedBoss();
    syncDowngradedFloors();
  }, [syncKills, syncAdjustedBoss, syncDowngradedFloors]);

  /* -------------------------------------------------------
     ⏱ Single polling timer
  ------------------------------------------------------- */
  useEffect(() => {
    const timer = setInterval(syncAll, 5000);
    return () => clearInterval(timer);
  }, [syncAll]);

  return {
    groupData,
    setGroupData,
    syncKills, // exposed for manual refresh buttons
  };
}
