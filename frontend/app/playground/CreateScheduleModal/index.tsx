"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { getDefaultModeChecklist } from "@/utils/playgroundHelpers";

interface Props {
  onClose: () => void;
  onConfirm: (
    conflictLevel: number,
    server: string,
    mode: "default" | "custom",
    checkedAbilities: { name: string; level: number; available: boolean }[]
  ) => void;
}

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

const DEFAULT_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "天诛",
  "引燃",
  "漾剑式",
  "兔死狐悲",
];

export default function CreateScheduleModal({ onClose, onConfirm }: Props) {
  const [conflictLevel, setConflictLevel] = useState<number>(10);
  const [server, setServer] = useState<string>("乾坤一掷");
  const [mode, setMode] = useState<"default" | "custom">("default");
  const [defaultChecklist, setDefaultChecklist] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "default") {
      setLoading(true);
      getDefaultModeChecklist()
        .then((list) => {
          const resolved = DEFAULT_ABILITIES.map((skill) => {
            const match = list.find(
              (a) => a.name === skill && a.level === conflictLevel
            );
            return match
              ? { ...match, available: true }
              : { name: skill, level: conflictLevel, available: false };
          });
          setDefaultChecklist(resolved);
        })
        .finally(() => setLoading(false));
    }
  }, [mode, conflictLevel]);

  const handleSubmit = () => {
    onConfirm(conflictLevel, server, mode, defaultChecklist);
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

        {mode === "default" && (
          <div className={styles.previewBox}>
            <h4>默认模式检查技能</h4>
            {loading ? (
              <p>加载中...</p>
            ) : (
              <ul>
                {defaultChecklist.map((a, idx) => (
                  <li
                    key={idx}
                    style={{ color: a.available ? "black" : "gray" }}
                  >
                    {a.name} (Lv{a.level}){" "}
                    {!a.available && "❌ 本周未掉落"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
