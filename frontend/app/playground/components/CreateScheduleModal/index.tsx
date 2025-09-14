"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import StandardScheduleForm from "./StandardScheduleForm";
import BossScheduleForm from "./BossScheduleForm";

type Mode = "standard" | "boss";

interface Props {
  onClose: () => void;
  onConfirm: (data: any, mode?: Mode) => void; 
  // ✅ make mode optional since "standard" doesn’t send it anymore
}

export default function CreateScheduleModal({ onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>("standard");

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>新建排表</h2>

        {/* 模式选择 */}
        <label className={styles.label}>
          模式
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className={styles.select}
          >
            <option value="standard">标准排表</option>
            <option value="boss">对单排表</option>
          </select>
        </label>

        {/* 标准排表 */}
        {mode === "standard" && (
          <StandardScheduleForm
            onClose={onClose}
            onConfirm={(data) => onConfirm(data, "standard")} 
            // ✅ explicitly mark as standard, but only for parent routing
          />
        )}

        {/* Boss 排表 */}
        {mode === "boss" && (
          <BossScheduleForm onClose={onClose} onConfirm={onConfirm} />
        )}
      </div>
    </div>
  );
}
