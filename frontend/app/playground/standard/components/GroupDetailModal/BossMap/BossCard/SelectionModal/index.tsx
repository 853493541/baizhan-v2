"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import bossSelection from "./boss_selection.json";

interface Props {
  scheduleId: string;
  groupIndex: number;
  floor: 90 | 100;
  currentBoss?: string;
  onClose: () => void;
  onSuccess: (boss: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function SelectionModal({
  scheduleId,
  groupIndex,
  floor,
  currentBoss,
  onClose,
  onSuccess,
}: Props) {
  const [selectedBoss, setSelectedBoss] = useState<string | null>(
    currentBoss || null
  );
  const [saving, setSaving] = useState(false);

  const bossNames = Object.keys(bossSelection);

  const handleConfirm = async () => {
    if (!selectedBoss || saving) return;

    try {
      setSaving(true);

      const res = await fetch(
        `${API_BASE}/api/standard-schedules/${scheduleId}/groups/${groupIndex}/adjust-boss`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            floor,
            boss: selectedBoss,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      onSuccess(selectedBoss);
      onClose();
    } catch (err) {
      console.error("❌ Failed to update adjusted boss:", err);
      alert("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>选择 {floor} 层首领</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✖
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.bossList}>
            {bossNames.map((boss) => (
              <button
                key={boss}
                className={`${styles.bossItem} ${
                  selectedBoss === boss ? styles.active : ""
                }`}
                onClick={() => setSelectedBoss(boss)}
              >
                {boss}
              </button>
            ))}
          </div>

          <div className={styles.preview}>
            {selectedBoss ? (
              <>
                <h4>{selectedBoss} · 技能预览</h4>
                <ul>
                  {bossSelection[selectedBoss as keyof typeof bossSelection].map(
                    (skill) => (
                      <li key={skill}>{skill}</li>
                    )
                  )}
                </ul>
              </>
            ) : (
              <div className={styles.placeholder}>请选择一个首领</div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            className={styles.confirmBtn}
            disabled={!selectedBoss || saving}
            onClick={handleConfirm}
          >
            {saving ? "保存中..." : "确认更换"}
          </button>
        </div>
      </div>
    </div>
  );
}
