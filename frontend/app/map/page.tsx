"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";
import CurrentWeek from "./components/CurrentWeek";
import BossSelectModal from "./components/BossSelectModal";

/* ============================================================
   SPECIAL BOSSES (90 / 100 floors)
============================================================ */
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

  /* ============================================================
     NORMAL BOSSES
  ============================================================ */
  const normalBosses = Object.keys(bossData).filter(
    (b) => !specialBosses.includes(b)
  );

  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

  const [floorAssignments, setFloorAssignments] =
    useState<Record<number, string>>({});

  const [status, setStatus] =
    useState<"idle" | "saving" | "success" | "error">("idle");

  const [locked, setLocked] = useState(false);

  const [selectingFloor, setSelectingFloor] = useState<number | null>(null);

  /* ============================================================
     FETCH WEEKLY MAP
  ============================================================ */
  const fetchMap = async () => {
    console.log("📌 Fetching weekly map...");

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`;
      const res = await fetch(url);

      console.log("📥 Response status:", res.status);

      if (!res.ok) {
        console.warn("⚠️ No existing map for this week.");
        return;
      }

      const data = await res.json();
      if (!data?.floors) return;

      const floors: Record<number, string> = {};
      for (const [floor, obj] of Object.entries(data.floors)) {
        floors[Number(floor)] = (obj as any).boss;
      }

      console.log("📊 Parsed floors:", floors);

      setFloorAssignments(floors);
      setLocked(data.locked ?? false);

      localStorage.setItem("weeklyFloors", JSON.stringify(floors));
    } catch (err) {
      console.error("❌ fetchMap failed:", err);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  /* ============================================================
     SAVE MAP
  ============================================================ */
  const persistToDB = async (floors: Record<number, string>) => {
    console.log("💾 Saving map to DB:", floors);

    setStatus("saving");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            floors: Object.fromEntries(
              Object.entries(floors).map(([k, v]) => [k, { boss: v }])
            ),
          }),
        }
      );

      if (!res.ok) throw new Error("Save failed");

      setStatus("success");
      setTimeout(() => setStatus("idle"), 1000);
    } catch (err) {
      console.error("❌ Failed to save weekly map:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  /* ============================================================
     LOCK
  ============================================================ */
  const lockMap = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map/lock`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Lock failed");
      setLocked(true);
    } catch (err) {
      console.error("❌ Lock failed:", err);
    }
  };

  /* ============================================================
     DELETE
  ============================================================ */
  const deleteCurrentWeek = async () => {
    console.log("🗑 Deleting weekly map…");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");

      setFloorAssignments({});
      setLocked(false);
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  /* ============================================================
     OPEN MODAL
  ============================================================ */
  const handleOpenModal = (floor: number) => {
    if (locked) return;
    setSelectingFloor(floor);
  };

  /* ============================================================
     FIXED — CORRECT SAME-RANGE CONFLICT LOGIC
  ============================================================ */
  const isSameRange = (a: number, b: number) => {
    // 81–89 together
    if (a >= 81 && a <= 89 && b >= 81 && b <= 89) return true;
    // 91–99 together
    if (a >= 91 && a <= 99 && b >= 91 && b <= 99) return true;
    // 90 isolated
    if (a === 90 && b === 90) return true;
    // 100 isolated
    if (a === 100 && b === 100) return true;

    return false;
  };

  /* ============================================================
     HANDLE BOSS PICK (fixed)
  ============================================================ */
  const applyBossSelection = (floor: number, boss: string) => {
    console.log(`📝 Selected boss "${boss}" for floor ${floor}`);

    const updated = { ...floorAssignments };

    // Remove only within SAME GROUP (not globally)
    for (const [f, b] of Object.entries(updated)) {
      const ff = Number(f);

      if (b === boss && isSameRange(ff, floor) && ff !== floor) {
        updated[ff] = "";
      }
    }

    updated[floor] = boss;

    setFloorAssignments(updated);
    localStorage.setItem("weeklyFloors", JSON.stringify(updated));

    persistToDB(updated);
    setSelectingFloor(null);
  };

  /* ============================================================
     RETURN FULL POOL BASED ON FLOOR RANGE
  ============================================================ */
  const getFullPool = (floor: number) => {
    if (floor === 90 || floor === 100) return specialBosses;

    if (floor >= 81 && floor <= 89) return normalBosses;
    if (floor >= 91 && floor <= 99) return normalBosses;

    return [];
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className={styles.container}>
      <CurrentWeek
        row1={row1}
        row2={row2}
        floorAssignments={floorAssignments}
        onFloorClick={handleOpenModal}
        onDelete={deleteCurrentWeek}
        status={status}
        locked={locked}
        onLock={lockMap}
      />

      {selectingFloor !== null && (
        <BossSelectModal
          floor={selectingFloor}
          pool={getFullPool(selectingFloor)}
          floorAssignments={floorAssignments}
          onClose={() => setSelectingFloor(null)}
          onPick={applyBossSelection}
        />
      )}
    </div>
  );
}
