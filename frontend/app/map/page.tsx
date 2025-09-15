"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";

// 精英 Boss（90、100 专用）
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

export default function MapPage() {
  const normalBosses = Object.keys(bossData).filter(
    (b) => !specialBosses.includes(b)
  );

  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

  const [floorAssignments, setFloorAssignments] = useState<
    Record<number, string>
  >({});
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  // 🔹 Persist to DB
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

  // 🔹 Load from backend first
  useEffect(() => {
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

    fetchMap();
  }, []);

  // 🔹 Handle selection
  const handleSelect = (floor: number, boss: string) => {
    setFloorAssignments((prev) => {
      const updated = { ...prev, [floor]: boss };
      localStorage.setItem("weeklyFloors", JSON.stringify(updated));
      persistToDB(updated);
      return updated;
    });
  };

  // ===== 去重逻辑 =====
  const used9 = new Set(
    row1
      .filter((f) => f >= 81 && f <= 89)
      .map((f) => floorAssignments[f])
      .filter(Boolean) as string[]
  );
  const used10 = new Set(
    row2
      .filter((f) => f >= 91 && f <= 99)
      .map((f) => floorAssignments[f])
      .filter(Boolean) as string[]
  );
  const usedSpecial = new Set(
    [90, 100]
      .map((f) => floorAssignments[f])
      .filter(Boolean) as string[]
  );

  const getAvailableBosses = (floor: number) => {
    if (floor === 90 || floor === 100) {
      return specialBosses.filter(
        (b) => !usedSpecial.has(b) || floorAssignments[floor] === b
      );
    }
    if (floor >= 81 && floor <= 89) {
      return normalBosses.filter(
        (b) => !used9.has(b) || floorAssignments[floor] === b
      );
    }
    if (floor >= 91 && floor <= 99) {
      return normalBosses.filter(
        (b) => !used10.has(b) || floorAssignments[floor] === b
      );
    }
    return normalBosses;
  };

  const renderRow = (floors: number[]) => (
    <div className={styles.row}>
      {floors.map((floor) => (
        <div key={floor} className={styles.card}>
          <div className={styles.floorLabel}>{floor}</div>
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
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>选择本周地图 (81–100 层)</h1>

      {renderRow(row1)}
      {renderRow(row2)}

      {/* Status bar */}
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

      <div className={styles.summary}>
        <h2>当前选择</h2>
        {[...row1, ...row2].map((f) => (
          <p key={f}>
            {f}: {floorAssignments[f] || "未选择"}
          </p>
        ))}
      </div>
    </div>
  );
}
