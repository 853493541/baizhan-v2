"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";

const specialBosses = [
  "武雪散",
  "萧武宗",
  "悉达罗摩",
  "阿基修斯",
  "提多罗吒",
  "萧沙",
  "谢云流",
  "卫栖梧",
  "牡丹",
  "迟驻",
];

interface WeeklyMapDoc {
  week: string;
  floors: Record<number, { boss: string }>;
}

export default function MapPage() {
  const normalBosses = Object.keys(bossData).filter(
    (b) => !specialBosses.includes(b)
  );

  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

  const [floorAssignments, setFloorAssignments] = useState<Record<number, string>>({});
  const [pastWeeks, setPastWeeks] = useState<WeeklyMapDoc[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [showHistory, setShowHistory] = useState(false); // ✅ collapsed by default

  const persistToDB = async (floors: Record<number, string>) => {
    setStatus("saving");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floors: Object.fromEntries(
            Object.entries(floors).map(([k, v]) => [k, { boss: v }])
          ),
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("❌ Failed to save weekly map:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const deleteCurrentWeek = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setFloorAssignments({});
      fetchPastWeeks(); // refresh history after delete
    } catch (err) {
      console.error("❌ Failed to delete weekly map:", err);
    }
  };

  const fetchMap = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`);
      if (res.ok) {
        const data = await res.json();
        const floors: Record<number, string> = {};
        for (const [floor, obj] of Object.entries(data.floors)) {
          floors[Number(floor)] = (obj as any).boss;
        }
        setFloorAssignments(floors);
        localStorage.setItem("weeklyFloors", JSON.stringify(floors));
      }
    } catch (err) {
      console.error("❌ Failed to load weekly map:", err);
    }
  };

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
    fetchMap();
    fetchPastWeeks();
  }, []);

  const handleSelect = (floor: number, boss: string) => {
    setFloorAssignments((prev) => {
      const updated = { ...prev, [floor]: boss };
      localStorage.setItem("weeklyFloors", JSON.stringify(updated));
      persistToDB(updated);
      return updated;
    });
  };

  const renderRow = (floors: number[], readonly = false, data?: Record<number, { boss: string }>) => (
    <div className={styles.row}>
      {floors.map((floor) => (
        <div key={floor} className={styles.card}>
          <div className={styles.floorLabel}>{floor}</div>
          {readonly ? (
            <div>{data?.[floor]?.boss || "未选择"}</div>
          ) : (
            <select
              className={
                floor === 90 || floor === 100
                  ? `${styles.dropdown} ${styles.dropdownElite}`
                  : styles.dropdown
              }
              value={floorAssignments[floor] || ""}
              onChange={(e) => handleSelect(floor, e.target.value)}
            >
              <option value="">-- 请选择 --</option>
              {getAvailableBosses(floor).map((boss) => (
                <option key={boss} value={boss}>
                  {boss}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );

  const getAvailableBosses = (floor: number) => {
    if (floor === 90 || floor === 100) {
      return specialBosses.filter(
        (b) => !new Set([90, 100].map((f) => floorAssignments[f])).has(b) || floorAssignments[floor] === b
      );
    }
    if (floor >= 81 && floor <= 89) {
      return normalBosses.filter(
        (b) => !new Set(row1.filter((f) => f !== floor).map((f) => floorAssignments[f])).has(b) || floorAssignments[floor] === b
      );
    }
    if (floor >= 91 && floor <= 99) {
      return normalBosses.filter(
        (b) => !new Set(row2.filter((f) => f !== floor).map((f) => floorAssignments[f])).has(b) || floorAssignments[floor] === b
      );
    }
    return normalBosses;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>选择本周地图 (81–100 层)</h1>

      {renderRow(row1)}
      {renderRow(row2)}

      <button onClick={deleteCurrentWeek} className={styles.deleteBtn}>
        删除当前周地图
      </button>

      {status !== "idle" && (
        <div
          className={`${styles.status} ${
            status === "success"
              ? styles.success
              : status === "error"
              ? styles.error
              : styles.saving
          }`}
        >
          {status === "saving" && "💾 正在保存..."}
          {status === "success" && "✅ 保存成功"}
          {status === "error" && "❌ 保存失败"}
        </div>
      )}

      {/* Collapsible history */}
      <div className={styles.summary}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={styles.toggleBtn}
        >
          {showHistory ? "▲ 收起历史周" : "▼ 展开历史周"}
        </button>

        {showHistory && (
          <>
            <h2>历史周地图 (最近 5 周)</h2>
            {pastWeeks.map((weekDoc) => (
              <div key={weekDoc.week}>
                <h3>{weekDoc.week}</h3>
                {renderRow(row1, true, weekDoc.floors)}
                {renderRow(row2, true, weekDoc.floors)}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
