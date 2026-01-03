"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import bossSelection from "./boss_selection.json";
import { calcBossNeeds } from "../calcBossNeeds";

import { toastSuccess, toastError } from "@/app/components/toast/toast";

interface Props {
  scheduleId: string;
  groupIndex: number;
  floor: 90 | 100;
  currentBoss?: string;

  group: any;
  bossData: Record<string, string[]>;
  highlightAbilities: string[];

  onClose: () => void;
  onSuccess: (boss: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function SelectionModal({
  scheduleId,
  groupIndex,
  floor,
  currentBoss,
  group,
  bossData,
  highlightAbilities,
  onClose,
  onSuccess,
}: Props) {
  const [saving, setSaving] = useState(false);

  /* ===============================
     ⭐ LOCAL ACTIVE MEMBERS
  ================================= */
  const [activeMembers, setActiveMembers] = useState<number[]>(() =>
    group.characters?.map((_: any, i: number) => i) ?? []
  );

  const toggleMember = (i: number) => {
    setActiveMembers((prev) =>
      prev.includes(i)
        ? prev.filter((x) => x !== i)
        : [...prev, i]
    );
  };

  const bossNames = Object.keys(bossSelection);
  const dropLevel: 9 | 10 = floor === 90 ? 9 : 10;

  const getRoleClass = (role?: string) => {
    if (!role) return "";
    switch (role.toLowerCase()) {
      case "tank":
        return styles.tank;
      case "dps":
        return styles.dps;
      case "healer":
        return styles.healer;
      default:
        return "";
    }
  };

  /* ===============================
     ✅ HANDLE SELECT BOSS
  ================================= */
  const handleSelectBoss = async (boss: string) => {
    if (saving) return;
    if (boss === currentBoss) return;

    try {
      setSaving(true);

      const res = await fetch(
        `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${groupIndex}/adjust-boss`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ floor, boss }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // ✅ toast instead of confirm modal
      toastSuccess(`${floor} 层已经修改为 ${boss}`);

      // let parent update state
      onSuccess(boss);

      // close modal
      onClose();
    } catch (err) {
      console.error("❌ Failed to update adjusted boss:", err);
      toastError("更新失败，请重试");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ================= HEADER ================= */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            自选 {floor} 层首领
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✖
          </button>
        </div>

        {/* ================= MEMBER FILTER ================= */}
        <div className={styles.memberBar}>
          <div className={styles.memberLine} />

          <div className={styles.memberButtons}>
            {group.characters?.map((c: any, i: number) => {
              const isActive = activeMembers.includes(i);
              const roleClass = getRoleClass(c.role);

              return (
                <button
                  key={i}
                  onClick={() => toggleMember(i)}
                  className={`
                    ${styles.memberBtn}
                    ${roleClass}
                    ${!isActive ? styles.inactiveBtn : ""}
                  `}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <div className={styles.memberLine} />
        </div>

        {/* ================= BOSS GRID ================= */}
        <div className={styles.bossGrid}>
          {bossNames.map((boss) => {
            const needs = calcBossNeeds({
              boss,
              bossData,
              group,
              activeMembers,
              dropLevel,
              highlightAbilities,
            });

            const isActive = boss === currentBoss;

            return (
              <div
                key={boss}
                className={`${styles.bossCard} ${
                  isActive ? styles.active : ""
                }`}
                onClick={() => handleSelectBoss(boss)}
                style={{
                  opacity: saving ? 0.6 : 1,
                  pointerEvents: saving ? "none" : "auto",
                }}
              >
                {isActive && (
                  <div className={styles.checkmark}>✓</div>
                )}

                <div className={styles.bossTitle}>{boss}</div>

                {needs.length > 0 ? (
                  <ul className={styles.needList}>
                    {needs.map((n) => (
                      <li
                        key={n.ability}
                        className={
                          n.isHighlight ? styles.coreHighlight : ""
                        }
                      >
                        {n.ability} ({n.needCount})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.noNeed}>无需求</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
