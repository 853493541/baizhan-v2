"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import MapRow from "../MapRow";

interface WeeklyMapDoc {
  week: string;
  floors: Record<number, { boss: string }>;
}

interface Props {
  row1: number[];
  row2: number[];
}

export default function HistorySection({ row1, row2 }: Props) {
  const [pastWeeks, setPastWeeks] = useState<WeeklyMapDoc[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPastWeeks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/history`);
      if (res.ok) {
        const data = await res.json();
        setPastWeeks(data);
      }
    } catch (err) {
      console.error("❌ Failed to fetch past weeks:", err);
    }
  };

  useEffect(() => {
    fetchPastWeeks();
  }, []);

  return (
    <section className={styles.historySection}>
      <button
        onClick={() => setShowHistory(!showHistory)}
        className={styles.toggleBtn}
      >
        {showHistory ? "▲ 历史" : "▼ 历史"}
      </button>

      {showHistory && (
        <div className={styles.historyContent}>
          <h2>最近 5 周</h2>
          {pastWeeks.map((weekDoc) => (
            <div key={weekDoc.week} className={styles.historyCard}>
              <h3>{weekDoc.week}</h3>
              <MapRow floors={row1} readonly data={weekDoc.floors} />
              <MapRow floors={row2} readonly data={weekDoc.floors} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
