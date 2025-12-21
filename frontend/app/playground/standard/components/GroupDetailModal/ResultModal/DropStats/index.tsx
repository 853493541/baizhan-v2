"use client";
import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";
import type { AssignedDrop } from "../index";

interface Props {
  group: GroupResult;
  assigned: AssignedDrop[];
}

export default function DropStats({ group, assigned }: Props) {
  const kills = group.kills || [];

  const totalLv9Boss = kills.filter(
    k => k.floor >= 81 && k.floor <= 90
  ).length;

  const totalLv10Boss = kills.filter(
    k => k.floor >= 91 && k.floor <= 100
  ).length;

  const lv9Assigned = assigned.filter(
    a => a.floor >= 81 && a.floor <= 90 && a.level === 9
  ).length;

  const lv10Assigned = assigned.filter(
    a => a.floor >= 91 && a.floor <= 100
  ).length;

  const lv10Books = assigned.filter(
    a => a.floor >= 91 && a.floor <= 100 && a.level === 10
  ).length;

  const percent = (n: number, d: number) =>
    d > 0 ? ((n / d) * 100).toFixed(1) : "0.0";

  const hasData = totalLv9Boss + totalLv10Boss > 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>掉落统计</h3>
        {hasData && (
          <span className={styles.sample}>
            {/* 样本数 {totalLv9Boss + totalLv10Boss} */}
          </span>
        )}
      </div>

      {totalLv9Boss > 0 && (
        <StatRow
          label="九阶首领掉率"
          ratio={`${lv9Assigned} / ${totalLv9Boss}`}
          percent={percent(lv9Assigned, totalLv9Boss)}
        />
      )}

      {totalLv10Boss > 0 && (
        <>
          <StatRow
            label="十阶首领掉率"
            ratio={`${lv10Assigned} / ${totalLv10Boss}`}
            percent={percent(lv10Assigned, totalLv10Boss)}
          />
          <StatRow
            label="十重书掉率"
            ratio={`${lv10Books} / ${totalLv10Boss}`}
            percent={percent(lv10Books, totalLv10Boss)}
          />
        </>
      )}

      {!hasData && (
        <div className={styles.empty}>暂无掉落数据</div>
      )}
    </div>
  );
}

/* =============================== */

function StatRow({
  label,
  ratio,
  percent,
}: {
  label: string;
  ratio: string;
  percent: string;
}) {
  const value = parseFloat(percent);

  let rateClass = styles.healer; // < 30%
  if (value > 50) {
    rateClass = styles.dps;      // > 50%
  } else if (value >= 30) {
    rateClass = styles.tank;     // 30–50%
  }

  return (
    <div className={styles.statRow}>
      <div className={styles.left}>
        <div className={styles.label}>{label}</div>
        <div className={styles.ratio}>{ratio}</div>
      </div>

      <div className={`${styles.badge} ${rateClass}`}>
        {percent}%
      </div>
    </div>
  );
}
