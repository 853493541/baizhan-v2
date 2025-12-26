"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import bossSelection from "./boss_selection.json";
import { calcBossNeeds } from "../calcBossNeeds";

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

  const bossNames = Object.keys(bossSelection);
  const dropLevel: 9 | 10 = floor === 90 ? 9 : 10;

  /* ===============================
     Click boss card = confirm
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

      onSuccess(boss);
      onClose();
    } catch (err) {
      console.error("❌ Failed to update adjusted boss:", err);
      alert("更新失败，请重试");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h3>选择 {floor} 层首领</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Boss Grid */}
        <div className={styles.bossGrid}>
          {bossNames.map((boss) => {
            const needs = calcBossNeeds({
              boss,
              bossData,
              group,
              activeMembers: [0, 1, 2],
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
                {/* ✅ Checkmark */}
                {isActive && (
                  <div className={styles.checkmark}>
                    ✓
                  </div>
                )}

                <div className={styles.bossTitle}>{boss}</div>

                {needs.length > 0 ? (
                  <ul className={styles.needList}>
                    {needs.map((n) => (
                      <li
                        key={n.ability}
                        className={n.isHighlight ? styles.coreHighlight : ""}
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
