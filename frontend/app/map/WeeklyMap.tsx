"use client";

import React, { useState, useEffect } from "react";
import bossData from "../data/boss_skills_collection_map.json";
import styles from "./styles.module.css";

/* ICONS */
import { Pencil, Check, Trash2 } from "lucide-react";

/* COMPONENTS */
import MapRow from "./components/MapRow";
import BossSelectModal from "./components/BossSelectModal";
import ConfirmModal from "@/app/components/ConfirmModal";

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
   WeeklyMap — reusable component (NOT a route)
============================================================ */
export default function WeeklyMap() {
  const normalBosses = Object.keys(bossData).filter(
    (b) => !specialBosses.includes(b)
  );

  const [floorAssignments, setFloorAssignments] =
    useState<Record<number, string>>({});
  const [status, setStatus] =
    useState<"idle" | "saving" | "success" | "error">("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [selectingFloor, setSelectingFloor] = useState<number | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  /* ---------------- FETCH MAP ---------------- */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`)
      .then((res) => res.ok && res.json())
      .then(
        (data) =>
          data && setFloorAssignments(parseFloorsFromAPI(data.floors))
      )
      .catch(() => {});
  }, []);

  /* ---------------- SAVE ---------------- */
  const persistToDB = async () => {
    setStatus("saving");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floors: Object.fromEntries(
            Object.entries(floorAssignments).map(([k, v]) => [
              k,
              { boss: v },
            ])
          ),
        }),
      });

      setStatus("success");
      setTimeout(() => setStatus("idle"), 800);
      setIsEditing(false);
    } catch {
      setStatus("error");
    }
  };

  /* ---------------- CLEAR (CONFIRMED) ---------------- */
  const clearCurrentWeek = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
        method: "DELETE",
      });
      setFloorAssignments({});
      setIsEditing(false);
    } catch {
      // silent
    }
  };

  /* ---------------- APPLY BOSS ---------------- */
  const applyBossSelection = (floor: number, boss: string) => {
    setFloorAssignments(
      applySelectionToFloors(floor, boss, floorAssignments)
    );
    setSelectingFloor(null);
  };

  return (
    <section className={styles.container}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <h1 className={styles.title}>地图</h1>

        <div className={styles.titleActions}>
          <button
            className={`${styles.iconBtn} ${
              isEditing ? styles.bgSuccess : styles.bgPrimary
            }`}
            onClick={() =>
              isEditing ? persistToDB() : setIsEditing(true)
            }
            title={isEditing ? "保存" : "编辑"}
          >
            {isEditing ? <Check size={16} /> : <Pencil size={16} />}
          </button>

          {isEditing && (
            <button
              className={`${styles.iconBtn} ${styles.bgDanger}`}
              onClick={() => setShowConfirmClear(true)}
              title="清空"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ================= MAP ================= */}
      <MapRow
        floors={row1}
        floorAssignments={floorAssignments}
        readonly={!isEditing}
        onClickFloor={(f) => isEditing && setSelectingFloor(f)}
      />

      <MapRow
        floors={row2}
        floorAssignments={floorAssignments}
        readonly={!isEditing}
        onClickFloor={(f) => isEditing && setSelectingFloor(f)}
      />

      {/* ================= BOSS SELECT ================= */}
      {selectingFloor !== null && (
        <BossSelectModal
          floor={selectingFloor}
          pool={getFullPool(selectingFloor, specialBosses, normalBosses)}
          floorAssignments={floorAssignments}
          onClose={() => setSelectingFloor(null)}
          onPick={applyBossSelection}
        />
      )}

      {/* ================= CONFIRM CLEAR ================= */}
      {showConfirmClear && (
        <ConfirmModal
          title="确认操作"
          message="确认清空本周排表吗？"
          intent="danger"
          confirmText="清空"
          cancelText="取消"
          onCancel={() => setShowConfirmClear(false)}
          onConfirm={() => {
            setShowConfirmClear(false);
            clearCurrentWeek();
          }}
        />
      )}
    </section>
  );
}
