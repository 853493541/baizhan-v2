"use client";

import { useEffect, useRef, useState } from "react";
import type { GroupResult } from "@/utils/solver";
import { toastSuccess, toastError } from "@/app/components/toast/toast";

export interface AssignedDrop {
  ability: string;
  level: number;
  char: string;
  floor: number;
  characterId?: string;
  role?: "DPS" | "Tank" | "Healer";
  status?: "assigned" | "pending" | "used" | "saved";
  character?: any;
  slot: "primary" | "secondary";
  boss: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function useResultWindow(
  scheduleId: string,
  group: GroupResult,
  onRefresh?: () => void
) {
  const [localGroup, setLocalGroup] = useState<GroupResult>(group);
  const [drops, setDrops] = useState<AssignedDrop[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastLocalUpdate = useRef<number>(0);

  /* ===============================
     🔄 Instant refresh
  ================================ */
  useEffect(() => {
    const fetchInstant = async () => {
      if (isRefreshing) return;

      try {
        setIsRefreshing(true);
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/kills`
        );
        if (!res.ok) return;

        const data = await res.json();
        setLocalGroup((prev) => ({
          ...prev,
          kills: data.kills ?? prev.kills,
          status: data.status ?? prev.status,
          startTime: data.startTime ?? prev.startTime,
          endTime: data.endTime ?? prev.endTime,
        }));

        lastLocalUpdate.current = Date.now();
      } catch (err) {
        console.error("❌ Instant refresh failed:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchInstant();
  }, [scheduleId, group.index]);

  /* ===============================
     🧩 Parent → local sync
  ================================ */
  useEffect(() => {
    const parentKills = group.kills?.length || 0;
    const localKills = localGroup.kills?.length || 0;
    const timeSinceLocal = Date.now() - lastLocalUpdate.current;

    if (parentKills > localKills || timeSinceLocal > 5000) {
      setLocalGroup(group);
    }
  }, [group]);

  /* ===============================
     🧮 Build drops list
  ================================ */
  useEffect(() => {
    if (!localGroup.kills) return;

    const idToChar: Record<string, any> = {};
    const idToName: Record<string, string> = {};
    const idToRole: Record<string, any> = {};

    localGroup.characters?.forEach((c: any) => {
      idToChar[c._id] = c;
      idToName[c._id] = c.name;
      idToRole[c._id] = c.role;
    });

    const parsed =
      localGroup.kills.flatMap((k: any) => {
        const result: AssignedDrop[] = [];

        if (k.selection?.ability && k.selection?.characterId) {
          result.push({
            ability: k.selection.ability,
            level: k.selection.level || 0,
            char: idToName[k.selection.characterId] || "",
            characterId: k.selection.characterId,
            floor: k.floor,
            role: idToRole[k.selection.characterId],
            status: k.selection.status || "assigned",
            character: idToChar[k.selection.characterId],
            slot: "primary",
            boss: k.boss,
          });
        }

        if (k.selectionSecondary?.ability && k.selectionSecondary?.characterId) {
          result.push({
            ability: k.selectionSecondary.ability,
            level: k.selectionSecondary.level || 0,
            char: idToName[k.selectionSecondary.characterId] || "",
            characterId: k.selectionSecondary.characterId,
            floor: k.floor,
            role: idToRole[k.selectionSecondary.characterId],
            status: k.selectionSecondary.status || "assigned",
            character: idToChar[k.selectionSecondary.characterId],
            slot: "secondary",
            boss: k.selectionSecondary.boss ?? k.boss,
          });
        }

        return result;
      }) || [];

    parsed.sort(
      (a, b) => a.char.localeCompare(b.char, "zh-CN") || a.floor - b.floor
    );

    setDrops(parsed);
  }, [localGroup]);

  /* ===============================
     🔁 Local status update
  ================================ */
  const updateStatus = (drop: AssignedDrop, status: AssignedDrop["status"]) => {
    setDrops((prev) =>
      prev.map((d) =>
        d.floor === drop.floor &&
        d.slot === drop.slot &&
        d.ability === drop.ability
          ? { ...d, status }
          : d
      )
    );
  };

  /* ===============================
     ✅ USE
  ================================ */
  const handleUse = async (drop: AssignedDrop) => {
    if (!drop.characterId) return toastError("角色信息缺失");

    setLoading(drop.ability);
    updateStatus(drop, "used");

    try {
      const charRes = await fetch(
        `${API_BASE}/api/characters/${drop.characterId}/abilities`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            abilities: { [drop.ability]: drop.level },
          }),
        }
      );
      if (!charRes.ok) throw new Error("更新角色技能失败");

      const url =
        drop.slot === "primary"
          ? `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${drop.floor}`
          : `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${drop.floor}/secondary-drop`;

      const payload =
        drop.slot === "primary"
          ? {
              boss: drop.boss,
              selection: {
                ability: drop.ability,
                level: drop.level,
                characterId: drop.characterId,
                status: "used",
              },
            }
          : {
              selection: {
                ability: drop.ability,
                level: drop.level,
                characterId: drop.characterId,
                status: "used",
              },
            };

      const schedRes = await fetch(url, {
        method: drop.slot === "primary" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!schedRes.ok) throw new Error("更新排表状态失败");

      toastSuccess(`已使用 ${drop.ability}（${drop.level}重）`);
      lastLocalUpdate.current = Date.now();
      onRefresh?.();
    } catch (err) {
      console.error("❌ Use failed:", err);
      updateStatus(drop, "assigned");
      toastError("使用失败，请稍后再试");
    } finally {
      setLoading(null);
    }
  };

  /* ===============================
     📦 STORE
  ================================ */
  const handleStore = async (drop: AssignedDrop) => {
    if (!drop.characterId) return toastError("角色信息缺失");

    setLoading(drop.ability);
    updateStatus(drop, "saved");

    try {
      const storeRes = await fetch(
        `${API_BASE}/api/characters/${drop.characterId}/storage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ability: drop.ability,
            level: drop.level,
            sourceBoss: drop.boss,
          }),
        }
      );
      if (!storeRes.ok) throw new Error("存入仓库失败");

      const url =
        drop.slot === "primary"
          ? `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${drop.floor}`
          : `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${drop.floor}/secondary-drop`;

      const payload =
        drop.slot === "primary"
          ? {
              boss: drop.boss,
              selection: {
                ability: drop.ability,
                level: drop.level,
                characterId: drop.characterId,
                status: "saved",
              },
            }
          : {
              selection: {
                ability: drop.ability,
                level: drop.level,
                characterId: drop.characterId,
                status: "saved",
              },
            };

      const schedRes = await fetch(url, {
        method: drop.slot === "primary" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!schedRes.ok) throw new Error("更新排表状态失败");

      toastSuccess(`已存入 ${drop.ability}（${drop.level}重）`);
      lastLocalUpdate.current = Date.now();
      onRefresh?.();
    } catch (err) {
      console.error("❌ Store failed:", err);
      updateStatus(drop, "assigned");
      toastError("存入失败，请稍后再试");
    } finally {
      setLoading(null);
    }
  };

  return {
    localGroup,
    drops,
    loading,
    handleUse,
    handleStore,
  };
}
