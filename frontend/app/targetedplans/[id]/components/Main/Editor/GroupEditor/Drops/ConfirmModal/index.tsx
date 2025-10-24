"use client";

import React from "react";
import { X } from "lucide-react";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function ConfirmModal({
  selectedAbility,
  selectedLevel,
  character,
  onUse,
  onSave,
  onBack,
  loading,
}: {
  selectedAbility: string;
  selectedLevel: 9 | 10;
  character: Character;
  onUse: () => void;
  onSave: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className={styles.container}>
      <button className={styles.closeBtn} onClick={onBack}>
        <X size={18} />
      </button>
      <div className={styles.line}>
        <span className={styles.levelTag}>{selectedLevel}重 ·</span>
        <img
          src={getAbilityIcon(selectedAbility)}
          alt={selectedAbility}
          className={styles.icon}
        />
        <span className={styles.ability}>{selectedAbility}</span>
        <span className={styles.arrow}>→</span>
        <span className={styles.char}>{character.name}</span>
      </div>

      <div className={styles.actions}>
        <button onClick={onUse} disabled={loading} className={styles.useBtn}>
          立即使用
        </button>
        <button onClick={onSave} disabled={loading} className={styles.saveBtn}>
          保存到背包
        </button>
      </div>
    </div>
  );
}
