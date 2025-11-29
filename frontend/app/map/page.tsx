"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";
import CurrentWeek from "./components/CurrentWeek";

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
  console.log("🚀 MapPage rendered");

  const normalBosses = Object.keys(bossData).filter(
    (b) => !specialBosses.includes(b)
  );

  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

  const [floorAssignments, setFloorAssignments] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [locked, setLocked] = useState(false);

  // -----------------------------
  // 🔍 Debug: fetch current week
  // -----------------------------
  const fetchMap = async () => {
    console.log("📌 Fetching weekly map...");

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`;
      console.log("🔗 API URL:", url);

      const res = await fetch(url);

      console.log("📥 Response status:", res.status);

      if (!res.ok) {
        console.warn("⚠️ Backend returned NOT OK. No map for this week.");
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
        console.log("📦 Raw data received:", data);
      } catch (parseErr) {
        console.error("❌ Failed to parse JSON:", parseErr);
        return;
      }

      if (!data || typeof data !== "object") {
        console.error("❌ Invalid data format:", data);
        return;
      }

      if (!data.floors) {
        console.error("❌ No floors found in response:", data);
        return;
      }

      const floors: Record<number, string> = {};

      for (const [floor, obj] of Object.entries(data.floors)) {
        console.log(`🧩 Parsing floor ${floor}:`, obj);
        floors[Number(floor)] = (obj as any).boss;
      }

      console.log("📊 Parsed floors:", floors);

      setFloorAssignments(floors);
      setLocked(data.locked ?? false);

      localStorage.setItem("weeklyFloors", JSON.stringify(floors));
      console.log("💾 Saved to localStorage!");

    } catch (err) {
      console.error("❌ fetchMap failed:", err);
    }
  };

  // -----------------------------
  // 🔍 Debug: Save to DB
  // -----------------------------
  const persistToDB = async (floors: Record<number, string>) => {
    console.log("💾 Saving new weekly map to DB:", floors);

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

      console.log("📥 Save response status:", res.status);

      if (!res.ok) throw new Error("Save failed");

      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error("❌ Failed to save:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  // -----------------------------
  // 🔍 Debug: lock week
  // -----------------------------
  const lockMap = async () => {
    console.log("🔒 Locking weekly map...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/lock`, {
        method: "POST",
      });

      console.log("📥 Lock response:", res.status);

      if (!res.ok) throw new Error("Lock failed");

      setLocked(true);
    } catch (err) {
      console.error("❌ Lock failed:", err);
    }
  };

  // -----------------------------
  // 🔍 Debug: delete week
  // -----------------------------
  const deleteCurrentWeek = async () => {
    console.log("🗑 Deleting weekly map...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "DELETE",
      });

      console.log("📥 Delete response:", res.status);

      if (!res.ok) throw new Error("Delete failed");

      setFloorAssignments({});
      setLocked(false);
      console.log("🧹 Cleared map & lock state");
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  const handleSelect = (floor: number, boss: string) => {
    console.log(`📝 Selecting boss "${boss}" for floor ${floor}`);

    setFloorAssignments((prev) => {
      const updated = { ...prev, [floor]: boss };
      console.log("📌 Updated floorAssignments:", updated);
      localStorage.setItem("weeklyFloors", JSON.stringify(updated));
      persistToDB(updated);
      return updated;
    });
  };

  const getAvailableBosses = (floor: number) => {
    console.log(`🔍 getAvailableBosses(${floor}) called`);

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
        locked={locked}
        onLock={lockMap}
      />
    </div>
  );
}
