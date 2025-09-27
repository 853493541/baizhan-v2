"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

interface AssignedDrop {
  ability: string;
  level: number;
  char: string;
  floor: number;
}

interface Props {
  group: GroupResult;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function ResultWindow({ group }: Props) {
  if (!group) return null;

  // ✅ Build ID → Name lookup
  const idToName: Record<string, string> = {};
  group.characters?.forEach((c: any) => {
    idToName[c._id] = c.name;
  });

  // ✅ Gather all assigned drops (include floor)
  const assigned: AssignedDrop[] =
    group.kills
      ?.flatMap((k: any) =>
        k.selection?.ability && k.selection?.characterId
          ? [
              {
                ability: k.selection.ability,
                level: k.selection.level || 0,
                char: idToName[k.selection.characterId] || "",
                floor: k.floor,
              },
            ]
          : []
      ) || [];

  // ✅ Sort: 九重 first, then 十重
  assigned.sort((a, b) => a.level - b.level);

  // === Boss counts by tier ===
  const totalLv9Boss = group.kills?.filter((k: any) => k.floor >= 81 && k.floor <= 90).length || 0;
  const totalLv10Boss = group.kills?.filter((k: any) => k.floor >= 91 && k.floor <= 100).length || 0;

  // === Drop counts by tier ===
  const lv9Assigned = assigned.filter((a) => a.floor >= 81 && a.floor <= 90 && a.level === 9).length;
  const lv10Assigned = assigned.filter((a) => a.floor >= 91 && a.floor <= 100).length;
  const lv10Books = assigned.filter((a) => a.floor >= 91 && a.floor <= 100 && a.level === 10).length;

  return (
    <div className={styles.row}>
      {/* === Left Box: 已分配掉落 === */}
      <div className={styles.box}>
        <h3 className={styles.title}>已分配掉落</h3>
        <ul className={styles.assignmentList}>
          {assigned.length > 0 ? (
            assigned.map((a: AssignedDrop, i: number) => (
              <li key={i} className={styles.assignmentItem}>
                <img
                  src={getAbilityIcon(a.ability)}
                  alt={a.ability}
                  className={styles.assignmentIcon}
                />
                <span>
                  {a.level === 9 ? "九重" : a.level === 10 ? "十重" : ""} ·{" "}
                  {a.ability} → {a.char}
                </span>
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
