"use client";
import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";
import type { AssignedDrop } from "../index";

interface Props {
  group: GroupResult & {
    startTime?: string | Date | null;
    endTime?: string | Date | null;
  };
  assigned: AssignedDrop[];
}

/* ===============================
   Helpers
================================ */

function formatTime(t?: string | Date | null) {
  if (!t) return "—";
  const d = new Date(t);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatDuration(start?: string | Date | null, end?: string | Date | null) {
  if (!start) return "—";

  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  if (isNaN(s) || isNaN(e) || e < s) return "—";

  const diff = Math.floor((e - s) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const sec = diff % 60;

  if (h > 0) return `${h}小时 ${m}分`;
  if (m > 0) return `${m}分 ${sec}秒`;
  return `${sec}秒`;
}

/* ===============================
   Component
================================ */

export default function DropStats({ group, assigned }: Props) {
  const kills = group.kills || [];

  const totalLv9Boss = kills.filter(
    (k) => k.floor >= 81 && k.floor <= 90
  ).length;

  const totalLv10Boss = kills.filter(
    (k) => k.floor >= 91 && k.floor <= 100
  ).length;

  const lv9Assigned = assigned.filter(
    (a) => a.floor >= 81 && a.floor <= 90 && a.level === 9
  ).length;

  const lv10Assigned = assigned.filter(
    (a) => a.floor >= 91 && a.floor <= 100
  ).length;

  const lv10Books = assigned.filter(
    (a) => a.floor >= 91 && a.floor <= 100 && a.level === 10
  ).length;

  const percent = (n: number, d: number) =>
    d > 0 ? ((n / d) * 100).toFixed(1) : "0.0";

  const started = !!group.startTime;
  const finished = !!group.endTime;

  return (
    <div className={styles.card}>
      {/* ===== Header ===== */}
      <div className={styles.header}>
        <h3 className={styles.title}>掉落统计</h3>
      </div>

      {/* ===== Drop rate section (ALWAYS render) ===== */}
      <StatRow
        label="九阶首领掉率"
        ratio={`${lv9Assigned} / ${totalLv9Boss}`}
        percent={percent(lv9Assigned, totalLv9Boss)}
      />

      <StatRow
        label="十阶首领掉率"
        ratio={`${lv10Assigned} / ${totalLv10Boss}`}
        percent={percent(lv10Assigned, totalLv10Boss)}
      />

      <StatRow
        label="十重书掉率"
        ratio={`${lv10Books} / ${totalLv10Boss}`}
        percent={percent(lv10Books, totalLv10Boss)}
        isLast
      />

      {/* ===== Divider (single, clean) ===== */}
      <div className={styles.divider} />

      {/* ===== Lifecycle section ===== */}
      <div className={styles.lifecycle}>
        <div className={styles.lifeRow}>
          <span className={styles.lifeLabel}>开始时间</span>
          <span>{formatTime(group.startTime)}</span>
        </div>

        <div className={styles.lifeRow}>
          <span className={styles.lifeLabel}>用时</span>
          <span>
            {started
              ? formatDuration(group.startTime, group.endTime) +
                (!finished ? "（进行中）" : "")
              : "—"}
          </span>
        </div>

        <div className={styles.lifeRow}>
          <span className={styles.lifeLabel}>结束时间</span>
          <span>{formatTime(group.endTime)}</span>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   StatRow
================================ */

function StatRow({
  label,
  ratio,
  percent,
  isLast,
}: {
  label: string;
  ratio: string;
  percent: string;
  isLast?: boolean;
}) {
  const value = parseFloat(percent);

  let rateClass = styles.healer;
  if (value > 50) rateClass = styles.dps;
  else if (value >= 30) rateClass = styles.tank;

  return (
    <div
      className={`${styles.statRow} ${isLast ? styles.noBorder : ""}`}
    >
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
