"use client";

import { useState } from "react";
import styles from "./styles.module.css";

interface Props {
  onConfirm: (ability: string, level: number) => void;
  onClose: () => void;
}

const QUICK_ABILITIES = [
  "斗转金移",
  "黑煞落贪狼",
  "引燃",
  "一闪天诛",
  "花钱消灾",
  "阴阳术退散",
  "漾剑式",
  "兔死狐悲",
];

export default function AbilityFilterModal({ onConfirm, onClose }: Props) {
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const pickLevel = (label: "<8" | "9" | "10") => {
    if (label === "<8") setSelectedLevel(-1); // -1 means "<8"
    else setSelectedLevel(parseInt(label, 10));
  };

  const handleConfirm = () => {
    if (selectedAbility && selectedLevel !== null) {
      onConfirm(selectedAbility, selectedLevel);
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>选择技能筛选</h3>

        <div className={styles.abilities}>
          {QUICK_ABILITIES.map((a) => (
            <button
              key={a}
              type="button"
              className={`${styles.ability} ${
                selectedAbility === a ? styles.active : ""
              }`}
              onClick={() => setSelectedAbility(a)}
            >
              <img src={`/icons/${a}.png`} alt={a} className={styles.icon} />
              <span>{a}</span>
            </button>
          ))}
        </div>

        {selectedAbility && (
          <div className={styles.levels}>
            {(["<8", "9", "10"] as const).map((label) => (
              <button
                key={label}
                type="button"
                className={`${styles.levelButton} ${
                  (label === "<8" && selectedLevel === -1) ||
                  (label !== "<8" && selectedLevel === parseInt(label, 10))
                    ? styles.selected
                    : ""
                }`}
                onClick={() => pickLevel(label)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={handleConfirm}
            disabled={!selectedAbility || selectedLevel === null}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
