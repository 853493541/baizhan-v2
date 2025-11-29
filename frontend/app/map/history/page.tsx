"use client";

import React, { useEffect, useState } from "react";
import MapRow from "../components/MapRow";
import styles from "./styles.module.css";

interface WeeklyMapDoc {
  week: string;
  floors: Record<number, { boss: string }>;
}

const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

function convertWeekLabel(weekStr: string) {
  return `第${weekStr.split("-W")[1]}周`;
}

export default function WeeklyMapHistoryPage() {
  const [history, setHistory] = useState<WeeklyMapDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAll, setLoadedAll] = useState(false);

  // Load initial 5
  const loadInitial = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/history`
      );
      const data = await res.json();
      setHistory(data || []);
    } catch (err) {
      console.error("❌ Failed to load weekly map history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load ALL and append
  const loadAllRemaining = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/history?all=1`
      );
      const allWeeks = await res.json();

      // append remaining items
      const extra = allWeeks.slice(history.length);
      setHistory((prev) => [...prev, ...extra]);

      setLoadedAll(true);
    } catch (err) {
      console.error("❌ Failed to load all history:", err);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.historyPage}>
      <h1 className={styles.title}>历史地图</h1>

      {history.length === 0 && <div className={styles.empty}>暂无历史记录</div>}

      <div className={styles.listContainer}>
        {history.map((week) => (
          <div key={week.week} className={styles.weekBlock}>
            <div className={styles.weekDivider}>
              <span>{convertWeekLabel(week.week)}</span>
            </div>

            <MapRow floors={row1} readonly data={week.floors} />
            <MapRow floors={row2} readonly data={week.floors} />
          </div>
        ))}
      </div>

      {!loadedAll && (
        <div className={styles.loadMoreContainer}>
          <button className={styles.loadMoreBtn} onClick={loadAllRemaining}>
            加载全部历史
          </button>
        </div>
      )}
    </div>
  );
}
