"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";

/* COMPONENTS */
import MapRow from "./components/MapRow";
import BossSelectModal from "./components/BossSelectModal";

/* HELPERS */
import {
  specialBosses,
  row1,
  row2,
  parseFloorsFromAPI,
  getFullPool,
  applySelectionToFloors,
} from "./mapHelpers";

/* ============================================================
   INTERNAL CurrentWeek component — combined 编辑/保存
============================================================ */
function CurrentWeek({
  floorAssignments,
  onFloorClick,
  onDelete,
  status,
  isEditing,
  onEditToggle,
  onSave,
}: {
  floorAssignments: Record<number, string>;
  onFloorClick: (floor: number) => void;
  onDelete: () => void;
  status: "idle" | "saving" | "success" | "error";
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
}) {
  const totalFloors = row1.length + row2.length;
  const selectedCount = Object.keys(floorAssignments).filter(
    (k) => floorAssignments[Number(k)]
  ).length;

  const handleRowClick = (floor: number) => {
    if (isEditing) onFloorClick(floor);
  };

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>本周地图</h1>

      <MapRow
        floors={row1}
        floorAssignments={floorAssignments}
        readonly={!isEditing}
        onClickFloor={handleRowClick}
      />

      <MapRow
        floors={row2}
        floorAssignments={floorAssignments}
        readonly={!isEditing}
        onClickFloor={handleRowClick}
      />

      <div className={styles.footer}>
        <p className={styles.counter}>
          已选择 {selectedCount} / {totalFloors}
          {status === "saving" && <span> 💾</span>}
          {status === "success" && <span> ✅</span>}
          {status === "error" && <span> ❌</span>}
        </p>

        <div className={styles.actionRow}>
          {/* 清空：只有在编辑时显示 */}
          {isEditing && (
            <button
              onClick={onDelete}
              className={styles.deleteBtn}
              disabled={selectedCount === 0}
            >
              清空
            </button>
          )}

          {/* 单按钮逻辑：编辑 / 保存 */}
          <button
            className={styles.lockBtn}
            onClick={() => {
              if (!isEditing) {
                onEditToggle();        // 进入编辑模式
              } else {
                onSave();              // 保存并退出编辑
              }
            }}
          >
            {isEditing ? "保存" : "编辑"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN PAGE — cleaned & simplified
============================================================ */
export default function MapPage() {
  const normalBosses = Object.keys(bossData).filter(
    (b) => !specialBosses.includes(b)
  );

  const [floorAssignments, setFloorAssignments] =
    useState<Record<number, string>>({});

  const [status, setStatus] =
    useState<"idle" | "saving" | "success" | "error">("idle");

  const [isEditing, setIsEditing] = useState(false);

  const [selectingFloor, setSelectingFloor] = useState<number | null>(null);

  /* ---------------- FETCH MAP ---------------- */
  const fetchMap = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`);
      if (!res.ok) return;

      const data = await res.json();
      setFloorAssignments(parseFloorsFromAPI(data.floors));
    } catch (err) {
      console.error("❌ fetchMap failed:", err);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  /* ---------------- SAVE MAP ---------------- */
  const persistToDB = async () => {
    setStatus("saving");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            floors: Object.fromEntries(
              Object.entries(floorAssignments).map(([k, v]) => [k, { boss: v }])
            ),
          }),
        }
      );

      if (!res.ok) throw new Error();

      setStatus("success");
      setTimeout(() => setStatus("idle"), 800);
      setIsEditing(false);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1200);
    }
  };

  /* ---------------- DELETE WEEK MAP ---------------- */
  const deleteCurrentWeek = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "DELETE",
      });

      setFloorAssignments({});
    } catch {
      console.error("❌ delete failed");
    }
  };

  /* ---------------- HANDLE BOSS PICK ---------------- */
  const applyBossSelection = (floor: number, boss: string) => {
    const updated = applySelectionToFloors(floor, boss, floorAssignments);
    setFloorAssignments(updated);
    setSelectingFloor(null);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className={styles.container}>
      <CurrentWeek
        floorAssignments={floorAssignments}
        onFloorClick={(f) => setSelectingFloor(f)}
        onDelete={deleteCurrentWeek}
        status={status}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing((v) => !v)}
        onSave={persistToDB}
      />

      {selectingFloor !== null && (
        <BossSelectModal
          floor={selectingFloor}
          pool={getFullPool(selectingFloor, specialBosses, normalBosses)}
          floorAssignments={floorAssignments}
          onClose={() => setSelectingFloor(null)}
          onPick={applyBossSelection}
        />
      )}
    </div>
  );
}
