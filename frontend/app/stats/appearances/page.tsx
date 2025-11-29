"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";

/* ---------------------- Interfaces ---------------------- */
interface BossInfo {
  count: number;
  weeks: string[];
  lastWeek: string;
  weeksAgo: number;
}

interface StatsResponse {
  nineStage: {
    pool: Record<string, BossInfo>;
    floor90: Record<string, BossInfo>;
  };
  tenStage: {
    pool: Record<string, BossInfo>;
    floor100: Record<string, BossInfo>;
  };
}

/* Special bosses to highlight */
const SPECIAL_BOSSES = new Set([
  "卫栖梧",
  "冯度",
  "阿依努尔",
  "方宇谦",
  "源明雅",
  "秦雷",
  "鬼影小次郎",
  "钱南撰",
]);

/* =========================================================
   PAGE
========================================================= */
export default function AppearancesPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 默认：十阶 + 精英
  const [tabStage, setTabStage] = useState<"9" | "10">("10");
  const [tabType, setTabType] = useState<"pool" | "special">("special");

  /* ---------------------- Fetch Stats ---------------------- */
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/stats`
        );
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className={styles.loading}>加载中...</div>;
  if (!stats) return <div className={styles.error}>读取统计失败</div>;

  const stage = tabStage === "9" ? stats.nineStage : stats.tenStage;
  const currentData =
    tabType === "pool"
      ? stage.pool
      : tabStage === "9"
      ? stage.floor90
      : stage.floor100;

  /* ---------------------- Sorting ---------------------- */
  const sortLogic = (a: [string, BossInfo], b: [string, BossInfo]) => {
    const A = a[1];
    const B = b[1];
    if (A.count !== B.count) return A.count - B.count;
    return B.weeksAgo - A.weeksAgo;
  };

  /* ---------------------- Chart A: weeksAgo ---------------------- */
  const buildAgoChart = (data: Record<string, BossInfo>) => {
    const arr = Object.entries(data)
      .map(([boss, info]) => ({ boss, value: info.weeksAgo }))
      .sort((a, b) => b.value - a.value);

    const maxVal = Math.max(...arr.map((x) => x.value), 0);
    return { arr, maxVal };
  };

  /* ---------------------- Chart B: count ---------------------- */
  const buildCountChart = (data: Record<string, BossInfo>) => {
    const arr = Object.entries(data)
      .map(([boss, info]) => ({ boss, value: info.count }))
      .sort((a, b) => b.value - a.value);

    const maxVal = Math.max(...arr.map((x) => x.value), 0);
    return { arr, maxVal };
  };

  const agoChart = buildAgoChart(currentData);
  const countChart = buildCountChart(currentData);

  /* ---------------------- Table Renderer ---------------------- */
  const renderTable = (data: Record<string, BossInfo>) => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>名称</th>
          <th>出现次数</th>
          <th>距离</th>
          <th>最近</th>
          <th>出现周</th>
        </tr>
      </thead>

      <tbody>
        {Object.entries(data)
          .sort(sortLogic)
          .map(([boss, info]) => {
            const isSpecial = SPECIAL_BOSSES.has(boss);

            return (
              <tr
                key={boss}
                className={isSpecial ? styles.redRow : ""}
              >
                <td>{boss}</td>
                <td>{info.count}</td>
                <td>{info.weeksAgo}</td>
                <td>{Number(info.lastWeek.split("-W")[1])}</td>
                <td>
                  {info.weeks.map((w) => Number(w.split("-W")[1])).join("， ")}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );

  /* ---------------------- Bar Chart Renderer ---------------------- */
  const renderBarChart = (
    data: { boss: string; value: number }[],
    max: number
  ) => (
    <div className={styles.chartContainer}>
      {data.map((item) => {
        const percent = max === 0 ? 0 : (item.value / max) * 100;
        const isSpecial = SPECIAL_BOSSES.has(item.boss);

        return (
          <div
            className={`${styles.chartRow} ${
              isSpecial ? styles.redBarRow : ""
            }`}
            key={item.boss}
          >
            <div className={styles.chartLabel}>{item.boss}</div>

            <div className={styles.chartBarWrapper}>
              <div
                className={`${styles.chartBar} ${
                  isSpecial ? styles.redBar : ""
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className={styles.chartValue}>{item.value}</div>
          </div>
        );
      })}
    </div>
  );

  /* ---------------------- PAGE RENDER ---------------------- */
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>首领上班次数统计</h2>

      {/* Stage Tabs */}
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${
            tabStage === "10" ? styles.activeTab : ""
          }`}
          onClick={() => setTabStage("10")}
        >
          十阶
        </div>

        <div
          className={`${styles.tab} ${
            tabStage === "9" ? styles.activeTab : ""
          }`}
          onClick={() => setTabStage("9")}
        >
          九阶
        </div>
      </div>

      {/* Sub Tabs */}
      <div className={styles.subTabs}>
        <div
          className={`${styles.subTab} ${
            tabType === "special" ? styles.activeSubTab : ""
          }`}
          onClick={() => setTabType("special")}
        >
          精英
        </div>

        <div
          className={`${styles.subTab} ${
            tabType === "pool" ? styles.activeSubTab : ""
          }`}
          onClick={() => setTabType("pool")}
        >
          普通
        </div>
      </div>

      {/* =====================
          精英：A → B
          普通：B → A
      ===================== */}
      {tabType === "special" ? (
        <>
          {/* Chart A */}
          <h3 className={styles.chartTitle}>距今多少周未上班</h3>
          {renderBarChart(agoChart.arr, agoChart.maxVal)}

          {/* Chart B */}
          <h3 className={styles.chartTitle}>出现次数统计</h3>
          {renderBarChart(countChart.arr, countChart.maxVal)}
        </>
      ) : (
        <>
          {/* Chart B */}
          <h3 className={styles.chartTitle}>出现次数统计</h3>
          {renderBarChart(countChart.arr, countChart.maxVal)}

          {/* Chart A */}
          <h3 className={styles.chartTitle}>距今多少周未上班</h3>
          {renderBarChart(agoChart.arr, agoChart.maxVal)}
        </>
      )}

      {/* TABLE */}
      <div className={styles.tableContainer}>{renderTable(currentData)}</div>
    </div>
  );
}
