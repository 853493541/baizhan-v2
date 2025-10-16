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
  const [loading, setLoading] = useState<string | null>(null);
  const [drops, setDrops] = useState<AssignedDrop[]>([]);
  const lastLocalUpdate = useRef<number>(Date.now()); // 🕒 remember freshest update time

  /* 🟢 Instant lightweight fetch on mount */
  useEffect(() => {
    const instantFetch = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/kills`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.kills) return;

        const updatedGroup = { ...group, kills: data.kills, status: data.status };
        buildDrops(updatedGroup);
        lastLocalUpdate.current = Date.now();
        console.log("[ResultWindow] Instant fetch applied");
      } catch (err) {
        console.error("❌ Instant refresh in ResultWindow failed:", err);
      }
    };
    instantFetch();
  }, [scheduleId, group.index]);

  // ✅ Build drops safely from any group
  const buildDrops = (grp: GroupResult) => {
    if (!grp) return;
    const idToChar: Record<string, any> = {};
    const idToName: Record<string, string> = {};
    const idToRole: Record<string, "DPS" | "Tank" | "Healer"> = {};

    grp.characters?.forEach((c: any) => {
      idToChar[c._id] = c;
      idToName[c._id] = c.name;
      idToRole[c._id] = c.role;
    });

    const parsed =
      grp.kills
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

    parsed.sort((a, b) => a.char.localeCompare(b.char, "zh-CN") || a.floor - b.floor);
    setDrops(parsed);
  };

  /* 🧩 Protect from parent overwrite */
  useEffect(() => {
    const parentKillCount = group.kills?.length || 0;
    const localKillCount = drops.length || 0;
    const timeSinceLocal = Date.now() - lastLocalUpdate.current;

    // only rebuild from parent if its data is newer or local is stale (>3s)
    if (parentKillCount > localKillCount || timeSinceLocal > 3000) {
      buildDrops(group);
    }
  }, [group]);

  const readTextSafe = async (res: Response) => {
    try {
      return await res.text();
    } catch {
      return "";
    }
  };

  // ✅ 使用：升级角色技能 + 标记为 used
  const handleUse = async (drop: AssignedDrop) => {
    if (!drop.characterId) return alert("角色信息缺失");
    if (!scheduleId) return alert("未能找到排表ID，无法更新分配状态。");

    setLoading(drop.ability);
    setDrops((p) =>
      p.map((d) =>
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

      const boss = group.kills?.find((k: any) => k.floor === drop.floor)?.boss;
      const schedUrl = `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/floor/${drop.floor}`;
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

  // ✅ 存入仓库：保存 storage + 标记为 saved
  const handleStore = async (drop: AssignedDrop) => {
    if (!drop.characterId) return alert("角色信息缺失");
    if (!scheduleId) return alert("未能找到排表ID，无法更新分配状态。");

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
        group.kills?.find((k: any) => k.floor === drop.floor)?.boss || "";
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

      const schedUrl = `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${group.index}/floor/${drop.floor}`;
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
        group={group}
        onUse={handleUse}
        onStore={handleStore}
        loading={loading}
      />
      <Processed drops={processedDrops} group={group} />
      <DropStats group={group} assigned={drops} />
    </div>
  );
}
