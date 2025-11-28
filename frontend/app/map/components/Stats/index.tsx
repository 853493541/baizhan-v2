"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";

interface BossInfo {
  count: number;
  weeks: string[];
  lastWeek: string;
  weeksAgo: number;
}

interface StatsResponse {
  floor90: Record<string, BossInfo>;
  floor100: Record<string, BossInfo>;
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Current Tab: 90 or 100
  const [tab, setTab] = useState<"90" | "100">("90");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/stats`
        );
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("❌ Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div className={styles.loading}>加载中...</div>;
  if (!stats) return <div className={styles.error}>读取统计失败</div>;

  /* ---------- Remove year (only show "第 X 周") ---------- */
  const formatWeek = (week: string) => {
    const num = Number(week.split("-W")[1]);
    return `第 ${num} 周`;
  };

  const currentData = tab === "90" ? stats.floor90 : stats.floor100;

  /* ---------- Table sorting logic ---------- */
  const sortLogic = (a: [string, BossInfo], b: [string, BossInfo]) => {
    const A = a[1];
    const B = b[1];

    // ① Fewest appearances first (升序)
    if (A.count !== B.count) return A.count - B.count;

    // ② If same count → longest ago first (降序)
    return B.weeksAgo - A.weeksAgo;
  };

  /* ---------- Bar chart sorting (simple) ---------- */
  const chartArr = Object.entries(currentData)
    .map(([boss, info]) => ({
      boss,
      value: info.weeksAgo,
    }))
    .sort((a, b) => b.value - a.value); // ONLY sort by weeksAgo

  const maxValue = Math.max(...chartArr.map((x) => x.value));

  /* ---------- Table ---------- */
  const renderTable = (data: Record<string, BossInfo>) => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Boss 名称</th>
          <th>出现次数</th>
          <th>最近出现</th>
          <th>距今（周）</th>
          <th>出现周数</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data)
          .sort(sortLogic)
          .map(([boss, info]) => (
            <tr key={boss}>
              <td>{boss}</td>
              <td>{info.count}</td>
              <td>{formatWeek(info.lastWeek)}</td>
              <td>{info.weeksAgo}</td>
              <td>{info.weeks.map((w) => formatWeek(w)).join("， ")}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );

  /* ---------- Bar Chart ---------- */
  const renderBarChart = (
    data: { boss: string; value: number }[],
    max: number
  ) => (
    <div className={styles.chartContainer}>
      {data.map((item) => {
        const percent = max === 0 ? 0 : (item.value / max) * 100;

        return (
          <div className={styles.chartRow} key={item.boss}>
            <div className={styles.chartLabel}>{item.boss}</div>

            <div className={styles.chartBarWrapper}>
              <div
                className={styles.chartBar}
                style={{ width: `${percent}%` }}
              ></div>
            </div>

            <div className={styles.chartValue}>{item.value}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>📊 Boss 出现分析</h2>

      {/* ====================== Tab UI ====================== */}
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${tab === "90" ? styles.activeTab : ""}`}
          onClick={() => setTab("90")}
        >
          90 层
        </div>

        <div
          className={`${styles.tab} ${tab === "100" ? styles.activeTab : ""}`}
          onClick={() => setTab("100")}
        >
          100 层
        </div>
      </div>

      {/* ====================== Table ====================== */}
      <div className={styles.tableContainer}>
        {renderTable(currentData)}
      </div>

      {/* ====================== Bar Chart ====================== */}
      <h3 className={styles.chartTitle}>{tab} 层 — 距今多少周未出现</h3>

      {renderBarChart(chartArr, maxValue)}
    </div>
  );
}
