"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import StandardScheduleForm from "./StandardScheduleForm";
import BossScheduleForm from "./BossScheduleForm";

type Mode = "standard" | "boss";

interface Props {
  onClose: () => void;
  onConfirm: (data: any, mode: Mode) => void;
}

export default function CreateScheduleModal({ onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>("standard");

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>新建排表</h2>

        {/* Mode selector */}
        <label className={styles.label}>
          模式
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className={styles.select}
          >
            <option value="standard">常规排表</option>
            <option value="boss">对单排表</option>
          </select>
        </label>

        {/* Render correct form */}
        {mode === "standard" ? (
          <StandardScheduleForm onClose={onClose} onConfirm={onConfirm} />
        ) : (
          <BossScheduleForm onClose={onClose} onConfirm={onConfirm} />
        )}
      </div>
    </div>
  );
}
