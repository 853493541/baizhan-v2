"use client";

import { useState, useEffect } from "react";
import abilities from "@/lib/seedAbilities";
import styles from "./styles.module.css";

interface Props {
  onConfirm: (ability: string, level: number) => void;
  onClose: () => void;
}

export default function AbilityFilterModal({ onConfirm, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [selectedAbility, setSelectedAbility] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number>(9);

  // Filter abilities by search
  const filtered = abilities.filter((a) =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-select first ability if none chosen yet
  useEffect(() => {
    if (filtered.length > 0 && !selectedAbility) {
      setSelectedAbility(filtered[0]);
    }
  }, [search]);

  const handleConfirm = () => {
    if (!selectedAbility) return;
    onConfirm(selectedAbility, selectedLevel);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>选择技能筛选</h3>

        <input
          type="text"
          placeholder="搜索技能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />

        <div className={styles.list}>
          {filtered.map((a) => (
            <div
              key={a}
              className={`${styles.item} ${
                selectedAbility === a ? styles.active : ""
              }`}
              onClick={() => setSelectedAbility(a)}
            >
              {a}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={styles.noResult}>没有匹配的技能</div>
          )}
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(Number(e.target.value))}
          className={styles.select}
        >
          <option value={9}>9级</option>
          <option value={10}>10级</option>
        </select>

        <div className={styles.actions}>
          <button onClick={handleConfirm} className={styles.confirm}>
            确认
          </button>
          <button onClick={onClose} className={styles.cancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
