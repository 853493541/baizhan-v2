"use client";

import React, { useState, useEffect } from "react";
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
}

interface Props {
  scheduleId: string; // ✅ required for backend route
  group: GroupResult;
  onRefresh?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function ResultWindow({ scheduleId, group, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<AssignedDrop[]>([]);

  // ✅ Convert group data into flat drop list
  useEffect(() => {
    if (!group) return;
    const idToName: Record<string, string> = {};
    const idToRole: Record<string, "DPS" | "Tank" | "Healer"> = {};

    group.characters?.forEach((c: any) => {
      idToName[c._id] = c.name;
      idToRole[c._id] = c.role;
    });

    const drops =
      group.kills
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
                },
              ]
            : []
        ) || [];

    drops.sort((a, b) => a.char.localeCompare(b.char, "zh-CN") || a.floor - b.floor);
    setAssigned(drops);
  }, [group]);

  if (!group) return null;

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

    // Optimistic UI update
    setAssigned((prev) =>
      prev.map((d) =>
        d.ability === drop.ability && d.floor === drop.floor ? { ...d, status: "used" } : d
      )
    );

    try {
      // 1️⃣ Update character’s ability level
      const charUrl = `${API_BASE}/api/characters/${drop.characterId}/abilities`;
      const charRes = await fetch(charUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abilities: { [drop.ability]: drop.level } }),
      });

      if (!charRes.ok) {
        const t = await readTextSafe(charRes);
        console.error("❌ 更新角色技能失败:", t);
        throw new Error("更新角色技能失败");
      }

      // 2️⃣ Update schedule record (add boss info)
      const boss = group.kills?.find((k: any) => k.floor === drop.floor)?.boss ?? undefined;
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

      if (!schedRes.ok) {
        const t = await readTextSafe(schedRes);
        console.error("❌ 更新排表状态失败:", t);
        throw new Error("更新排表状态失败");
      }

      alert(`✅ 已使用 ${drop.ability} (${drop.level}重)`);
      await onRefresh?.();
    } catch (err) {
      console.error("❌ Use drop failed:", err);
      // Roll back
      setAssigned((prev) =>
        prev.map((d) =>
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

    // Optimistic UI update
    setAssigned((prev) =>
      prev.map((d) =>
        d.ability === drop.ability && d.floor === drop.floor ? { ...d, status: "saved" } : d
      )
    );

    try {
      // 1️⃣ Save to character’s storage
      const sourceBoss = group.kills?.find((k: any) => k.floor === drop.floor)?.boss || "";
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

      if (!storeRes.ok) {
        const t = await readTextSafe(storeRes);
        console.error("❌ 存入仓库失败:", t);
        throw new Error("存入仓库失败");
      }

      // 2️⃣ Update schedule record
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

      if (!schedRes.ok) {
        const t = await readTextSafe(schedRes);
        console.error("❌ 更新排表状态失败:", t);
        throw new Error("更新排表状态失败");
      }

      alert(`💾 已存入仓库：${drop.ability} (${drop.level}重)`);
      await onRefresh?.();
    } catch (err) {
      console.error("❌ Store drop failed:", err);
      // Roll back
      setAssigned((prev) =>
        prev.map((d) =>
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

  // ✅ Split assigned vs processed
  const assignedDrops = assigned.filter(
    (d) => d.status === "assigned" || d.status === "pending"
  );
  const processedDrops = assigned.filter(
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
      <Processed drops={processedDrops} />
      <DropStats group={group} assigned={assigned} />
    </div>
  );
}
