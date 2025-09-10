"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";

interface Props {
  onClose: () => void;
  onConfirm: (conflictLevel: number, server: string, mode: "default" | "custom") => void;
}

export default function CreateScheduleModal({ onClose, onConfirm }: Props) {
  const [conflictLevel, setConflictLevel] = useState<number>(10);
  const [server, setServer] = useState<string>("乾坤一掷");
  const [mode, setMode] = useState<"default" | "custom">("default");

  const handleSubmit = () => {
    onConfirm(conflictLevel, server, mode);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>新建排表</h2>

        <label className={styles.label}>
          冲突等级:
          <select
            value={conflictLevel}
            onChange={(e) => setConflictLevel(Number(e.target.value))}
            className={styles.select}
          >
            <option value={9}>9</option>
            <option value={10}>10</option>
          </select>
        </label>

        <label className={styles.label}>
          服务器:
          <input
            type="text"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          模式:
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "default" | "custom")}
            className={styles.select}
          >
            <option value="default">默认模式</option>
            <option value="custom">自定义模式</option>
          </select>
        </label>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>
            取消
          </button>
          <button className={styles.confirm} onClick={handleSubmit}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
