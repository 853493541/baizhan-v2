"use client";
import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";
import type { AssignedDrop } from "../index";

export default function DropStats({
  group,
  assigned,
}: {
  group: GroupResult;
  assigned: AssignedDrop[];
}) {
  // 🟩 Always use real kills list (from backend)
  const kills = group.kills || [];

  // 🟫 Denominators – how many bosses killed
  const totalLv9Boss = kills.filter(k => k.floor >= 81 && k.floor <= 90).length;
  const totalLv10Boss = kills.filter(k => k.floor >= 91 && k.floor <= 100).length;

  // 🟦 Numerators – how many drops actually assigned
  const lv9Assigned = assigned.filter(
    a => a.floor >= 81 && a.floor <= 90 && a.level === 9
  ).length;

  // any 10-tier drop counts as assigned for that tier
  const lv10Assigned = assigned.filter(
    a => a.floor >= 91 && a.floor <= 100
  ).length;

  // only level-10 abilities count as “books”
  const lv10Books = assigned.filter(
    a => a.floor >= 91 && a.floor <= 100 && a.level === 10
  ).length;

  const percent = (num: number, denom: number) =>
    denom > 0 ? ((num / denom) * 100).toFixed(1) : "0.0";

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>掉落数据</h3>

      {totalLv9Boss > 0 && (
        <p>
          九阶首领掉率: {lv9Assigned}/{totalLv9Boss} (
          {percent(lv9Assigned, totalLv9Boss)}%)
        </p>
      )}

      {totalLv10Boss > 0 && (
        <>
          <p>
            十阶首领掉率: {lv10Assigned}/{totalLv10Boss} (
            {percent(lv10Assigned, totalLv10Boss)}%)
          </p>
          <p>
            十重书掉率: {lv10Books}/{totalLv10Boss} (
            {percent(lv10Books, totalLv10Boss)}%)
          </p>
        </>
      )}

      {totalLv9Boss + totalLv10Boss === 0 && <p>暂无数据</p>}
    </div>
  );
}
