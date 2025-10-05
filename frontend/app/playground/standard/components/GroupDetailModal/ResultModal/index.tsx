"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

interface AssignedDrop {
  ability: string;
  level: number;
  char: string;
  floor: number;
  characterId?: string;
  status?: "assigned" | "pending" | "used" | "saved";
}

interface Props {
  group: GroupResult;
  onRefresh?: () => void; // 🔹 optional parent refresh callback
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function ResultWindow({ group, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!group) return null;

  // ✅ Build ID → Name lookup
  const idToName: Record<string, string> = {};
  group.characters?.forEach((c: any) => {
    idToName[c._id] = c.name;
  });

  // ✅ Gather all assigned drops (include floor + status)
  const assigned: AssignedDrop[] =
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
                status: k.selection.status || "assigned",
              },
            ]
          : []
      ) || [];

  assigned.sort((a, b) => a.level - b.level);

  // === Stats ===
  const totalLv9Boss = group.kills?.filter((k: any) => k.floor >= 81 && k.floor <= 90).length || 0;
  const totalLv10Boss = group.kills?.filter((k: any) => k.floor >= 91 && k.floor <= 100).length || 0;
  const lv9Assigned = assigned.filter((a) => a.floor >= 81 && a.floor <= 90 && a.level === 9).length;
  const lv10Assigned = assigned.filter((a) => a.floor >= 91 && a.floor <= 100).length;
  const lv10Books = assigned.filter((a) => a.floor >= 91 && a.floor <= 100 && a.level === 10).length;

  // === 🧩 Action Handlers ===
  const handleUse = async (drop: AssignedDrop) => {
    if (!drop.characterId) return alert("角色信息缺失");
    setLoading(drop.ability);

    try {
      // 1️⃣ Update ability level
      await fetch(`${API_BASE}/api/characters/${drop.characterId}/abilities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abilities: { [drop.ability]: drop.level },
        }),
      });

      // 2️⃣ Mark selection.status = "used"
      await fetch(`${API_BASE}/api/schedules/${group._id}/groups/${group.index}/floor/${drop.floor}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection: {
            ability: drop.ability,
            level: drop.level,
            characterId: drop.characterId,
            status: "used",
          },
        }),
      });

      alert(`✅ 已使用 ${drop.ability} (${drop.level}重)`);
      onRefresh?.();
    } catch (err) {
      console.error("❌ Use drop failed:", err);
      alert("使用失败，请稍后再试。");
    } finally {
      setLoading(null);
    }
  };

  const handleStore = async (drop: AssignedDrop) => {
    if (!drop.characterId) return alert("角色信息缺失");
    setLoading(drop.ability);

    try {
      // 1️⃣ Add to character storage
      await fetch(`${API_BASE}/api/characters/${drop.characterId}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ability: drop.ability,
          level: drop.level,
          sourceBoss: group.kills.find((k: any) => k.floor === drop.floor)?.boss || "",
        }),
      });

      // 2️⃣ Mark selection.status = "saved"
      await fetch(`${API_BASE}/api/schedules/${group._id}/groups/${group.index}/floor/${drop.floor}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection: {
            ability: drop.ability,
            level: drop.level,
            characterId: drop.characterId,
            status: "saved",
          },
        }),
      });

      alert(`💾 已存入仓库：${drop.ability} (${drop.level}重)`);
      onRefresh?.();
    } catch (err) {
      console.error("❌ Store drop failed:", err);
      alert("存入失败，请稍后再试。");
    } finally {
      setLoading(null);
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "used":
        return <span className={`${styles.badge} ${styles.used}`}>已使用</span>;
      case "saved":
        return <span className={`${styles.badge} ${styles.saved}`}>已存入仓库</span>;
      case "pending":
        return <span className={`${styles.badge} ${styles.pending}`}>待使用</span>;
      default:
        return <span className={`${styles.badge} ${styles.assigned}`}>已分配</span>;
    }
  };

  return (
    <div className={styles.row}>
      {/* === Left Box: 已分配掉落 === */}
      <div className={styles.box}>
        <h3 className={styles.title}>掉落管理</h3>
        <ul className={styles.assignmentList}>
          {assigned.length > 0 ? (
            assigned.map((a: AssignedDrop, i: number) => (
              <li key={i} className={styles.assignmentItem}>
                <img
                  src={getAbilityIcon(a.ability)}
                  alt={a.ability}
                  className={styles.assignmentIcon}
                />
                <span className={styles.assignmentText}>
                  {a.level === 9 ? "九重" : a.level === 10 ? "十重" : ""} · {a.ability} → {a.char}
                </span>
                {renderStatusBadge(a.status)}
                {a.status === "assigned" || a.status === "pending" ? (
                  <div className={styles.btnGroup}>
                    <button
                      disabled={loading === a.ability}
                      onClick={() => handleUse(a)}
                      className={styles.useBtn}
                    >
                      使用
                    </button>
                    <button
                      disabled={loading === a.ability}
                      onClick={() => handleStore(a)}
                      className={styles.storeBtn}
                    >
                      存入仓库
                    </button>
                  </div>
                ) : null}
              </li>
            ))
          ) : (
            <p>暂无分配</p>
          )}
        </ul>
      </div>

      {/* === Right Box: 掉落率分析 === */}
      <div className={styles.box}>
        <h3 className={styles.title}>掉落率分析</h3>
        {totalLv9Boss > 0 && (
          <p>
            九阶首领掉率: {lv9Assigned}/{totalLv9Boss} (
            {((lv9Assigned / totalLv9Boss) * 100).toFixed(1)}%)
          </p>
        )}
        {totalLv10Boss > 0 && (
          <>
            <p>
              十阶首领掉率: {lv10Assigned}/{totalLv10Boss} (
              {((lv10Assigned / totalLv10Boss) * 100).toFixed(1)}%)
            </p>
            <p>
              十重书掉率: {lv10Books}/{totalLv10Boss} (
              {((lv10Books / totalLv10Boss) * 100).toFixed(1)}%)
            </p>
          </>
        )}
        {totalLv9Boss + totalLv10Boss === 0 && <p>暂无数据</p>}
      </div>
    </div>
  );
}
