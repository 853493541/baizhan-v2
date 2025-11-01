"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import Assigned from "./Assigned";
import Processed from "./Processed";
import DropStats from "./DropStats";
import type { GroupResult } from "@/utils/solver";

export interface AssignedDrop {
  ability: string;
  level: number;
  char: string;
  floor: number;
  characterId?: string;
  role?: "DPS" | "Tank" | "Healer";
  status?: "assigned" | "pending" | "used" | "saved";
  character?: any;
}

interface Props {
  scheduleId: string;
  group: GroupResult;
  onRefresh?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function ResultWindow({ scheduleId, group, onRefresh }: Props) {
  const [localGroup, setLocalGroup] = useState<GroupResult>(group);
  const [drops, setDrops] = useState<AssignedDrop[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastLocalUpdate = useRef<number>(0);

  /* 🟢 Instant lightweight refresh on open (with guard) */
  useEffect(() => {
    const fetchInstant = async () => {
      if (isRefreshing) {
        console.log("⏳ Skipping instant fetch — already in progress");
        return;
      }

      try {
        setIsRefreshing(true);
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/kills`
        );
        if (!res.ok) return;
        const data = await res.json();

        const merged = {
          ...group,
          kills: data.kills || [],
          status: data.status || group.status,
        };
        setLocalGroup(merged);
        lastLocalUpdate.current = Date.now();
        console.log("⚡ Instant refresh applied in ResultWindow");
      } catch (err) {
        console.error("❌ Instant refresh failed:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchInstant();
  }, [scheduleId, group.index, isRefreshing, group, setLocalGroup]);

  /* 🧩 Smart merge – don’t overwrite fresher local data */
  useEffect(() => {
    if (!group) return;
    const parentKills = group.kills?.length || 0;
    const localKills = localGroup.kills?.length || 0;
    const timeSinceLocal = Date.now() - lastLocalUpdate.current;

    if (parentKills > localKills || timeSinceLocal > 5000) {
      setLocalGroup(group); // parent likely newer
    } else {
      console.log("🛡️ Ignoring parent overwrite (local newer)");
    }
  }, [group]);

  /* 🧮 Rebuild drop list whenever localGroup changes */
  useEffect(() => {
    if (!localGroup.kills) return;

    const idToChar: Record<string, any> = {};
    const idToName: Record<string, string> = {};
    const idToRole: Record<string, "DPS" | "Tank" | "Healer"> = {};

    localGroup.characters?.forEach((c: any) => {
      idToChar[c._id] = c;
      idToName[c._id] = c.name;
      idToRole[c._id] = c.role;
    });

    const parsed =
      localGroup.kills
        ?.flatMap((k: any) =>
          k.selection?.ability && k.selection?.characterId
            ? [
                {
                  ability: k.selection.ability,
                  level: k.selection.level || 0,
                  char: idToName[k.selection.characterId] || "",
                  characterId: k.selection.characterId,
                  floor: k.floor,
                  role: idToRole[k.selection.characterId],
                  status: k.selection.status || "assigned",
                  character: idToChar[k.selection.characterId],
                },
              ]
            : []
        ) || [];

    parsed.sort(
      (a, b) =>
        a.char.localeCompare(b.char, "zh-CN") || a.floor - b.floor
    );
    setDrops(parsed);
  }, [localGroup]);

  /* 🔧 Safe text reader helper */
  const readTextSafe = async (res: Response) => {
    try {
      return await res.text();
    } catch {
      return "";
    }
  };

  /* ✅ 使用：升级角色技能 + 标记为 used */
  const handleUse = async (drop: AssignedDrop) => {
    if (!drop.characterId) return alert("角色信息缺失");
    if (!scheduleId) return alert("未能找到排表ID");

    setLoading(drop.ability);
    setDrops((prev) =>
      prev.map((d) =>
        d.ability === drop.ability && d.floor === drop.floor
          ? { ...d, status: "used" }
          : d
      )
    );

    try {
      const charUrl = `${API_BASE}/api/characters/${drop.characterId}/abilities`;
      const charRes = await fetch(charUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abilities: { [drop.ability]: drop.level } }),
      });
      if (!charRes.ok) throw new Error("更新角色技能失败");

      const boss =
        localGroup.kills?.find((k: any) => k.floor === drop.floor)?.boss;
      const schedUrl = `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${drop.floor}`;
      const schedRes = await fetch(schedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boss,
          selection: {
            ability: drop.ability,
            level: drop.level,
            characterId: drop.characterId,
            status: "used",
          },
        }),
      });
      if (!schedRes.ok) throw new Error("更新排表状态失败");

      alert(`✅ 已使用 ${drop.ability} (${drop.level}重)`);
      lastLocalUpdate.current = Date.now();
      setDrops((p) => [...p]);
      await onRefresh?.();
    } catch (err) {
      console.error("❌ Use drop failed:", err);
      setDrops((p) =>
        p.map((d) =>
          d.ability === drop.ability && d.floor === drop.floor
            ? { ...d, status: "assigned" }
            : d
        )
      );
      alert("使用失败，请稍后再试。");
    } finally {
      setLoading(null);
    }
  };

  /* ✅ 存入仓库：保存 storage + 标记为 saved */
  const handleStore = async (drop: AssignedDrop) => {
    if (!drop.characterId) return alert("角色信息缺失");
    if (!scheduleId) return alert("未能找到排表ID");

    setLoading(drop.ability);
    setDrops((p) =>
      p.map((d) =>
        d.ability === drop.ability && d.floor === drop.floor
          ? { ...d, status: "saved" }
          : d
      )
    );

    try {
      const sourceBoss =
        localGroup.kills?.find((k: any) => k.floor === drop.floor)?.boss || "";
      const storeUrl = `${API_BASE}/api/characters/${drop.characterId}/storage`;
      const storeRes = await fetch(storeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ability: drop.ability,
          level: drop.level,
          sourceBoss,
        }),
      });
      if (!storeRes.ok) throw new Error("存入仓库失败");

      const schedUrl = `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${localGroup.index}/floor/${drop.floor}`;
      const schedRes = await fetch(schedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boss: sourceBoss || undefined,
          selection: {
            ability: drop.ability,
            level: drop.level,
            characterId: drop.characterId,
            status: "saved",
          },
        }),
      });
      if (!schedRes.ok) throw new Error("更新排表状态失败");

      lastLocalUpdate.current = Date.now();
      setDrops((p) => [...p]);
      await onRefresh?.();
    } catch (err) {
      console.error("❌ Store drop failed:", err);
      setDrops((p) =>
        p.map((d) =>
          d.ability === drop.ability && d.floor === drop.floor
            ? { ...d, status: "assigned" }
            : d
        )
      );
      alert("存入失败，请稍后再试。");
    } finally {
      setLoading(null);
    }
  };

  /* ✅ Split assigned vs processed */
  const assignedDrops = drops.filter(
    (d) => d.status === "assigned" || d.status === "pending"
  );
  const processedDrops = drops.filter(
    (d) => d.status === "used" || d.status === "saved"
  );

  return (
    <div className={styles.row}>
      <Assigned
        drops={assignedDrops}
        group={localGroup}
        onUse={handleUse}
        onStore={handleStore}
        loading={loading}
      />
      <Processed drops={processedDrops} group={localGroup} />
      <DropStats group={localGroup} assigned={drops} />
    </div>
  );
}
