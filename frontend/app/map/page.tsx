"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";
import CurrentWeek from "./components/CurrentWeek";
import HistorySection from "./components/HistorySection";


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

  const [floorAssignments, setFloorAssignments] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [locked, setLocked] = useState(false); // ✅ track lock state

  // 🔹 Save to DB
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

  // 🔹 Delete current week
  const deleteCurrentWeek = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setFloorAssignments({});
      setLocked(false); // ✅ reset lock when deleting
    } catch (err) {
      console.error("❌ Failed to delete weekly map:", err);
    }
  };

  // 🔹 Fetch current week
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
        setLocked(data.locked ?? false); // ✅ read locked state
        localStorage.setItem("weeklyFloors", JSON.stringify(floors));
      }
    } catch (err) {
      console.error("❌ Failed to load weekly map:", err);
    }
  };

  // 🔹 Lock current week
  const lockMap = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/lock`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Lock failed");
      setLocked(true);
    } catch (err) {
      console.error("❌ Failed to lock weekly map:", err);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  // 🔹 Handle dropdown select
  const handleSelect = (floor: number, boss: string) => {
    setFloorAssignments((prev) => {
      const updated = { ...prev, [floor]: boss };
      localStorage.setItem("weeklyFloors", JSON.stringify(updated));
      persistToDB(updated);
      return updated;
    });
  };

  // 🔹 Boss options filtering
  const getAvailableBosses = (floor: number) => {
    if (floor === 90 || floor === 100) {
      return specialBosses.filter(
        (b) =>
          !new Set([90, 100].map((f) => floorAssignments[f])).has(b) ||
          floorAssignments[floor] === b
      );
    }
    if (floor >= 81 && floor <= 89) {
      return normalBosses.filter(
        (b) =>
          !new Set(row1.filter((f) => f !== floor).map((f) => floorAssignments[f])).has(b) ||
          floorAssignments[floor] === b
      );
    }
    if (floor >= 91 && floor <= 99) {
      return normalBosses.filter(
        (b) =>
          !new Set(row2.filter((f) => f !== floor).map((f) => floorAssignments[f])).has(b) ||
          floorAssignments[floor] === b
      );
    }
    return normalBosses;
  };

  return (
    <div className={styles.container}>
      <CurrentWeek
        row1={row1}
        row2={row2}
        floorAssignments={floorAssignments}
        onSelect={handleSelect}
        getAvailableBosses={getAvailableBosses}
        onDelete={deleteCurrentWeek}
        status={status}
        locked={locked}       // ✅ pass lock state
        onLock={lockMap}      // ✅ lock handler
      />

      <HistorySection row1={row1} row2={row2} />
    </div>
  );
}
