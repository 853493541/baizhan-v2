"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";

interface CharacterAbilitiesProps {
  abilities: Record<string, number>;
}

const levelOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function CharacterAbilities({ abilities }: CharacterAbilitiesProps) {
  const [open, setOpen] = useState(false);

  // Group abilities by level
  const grouped: Record<number, string[]> = {};
  for (const [name, value] of Object.entries(abilities)) {
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(name);
  }

  for (const lvl of Object.keys(grouped)) {
    grouped[Number(lvl)].sort();
  }

  return (
    <div className={styles.scanBox}>
      <div className={styles.scanHeader}>
        <span className={styles.scanIcon}>🔍</span>
        <h2 className={styles.scanTitle}>OCR扫描结果</h2>
      </div>

      <button onClick={() => setOpen(true)} className={styles.showButton}>
        查看全部技能（重数排序）
      </button>

      <p className={styles.lastScan}>上次扫描时间：8天前</p>

      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {levelOrder.map((lvl) => {
              if (!grouped[lvl] || grouped[lvl].length === 0) return null;
              return (
                <div key={lvl} className={styles.levelBlock}>
                  <h3 className={styles.levelTitle}>{lvl}重</h3>
                  <div className={styles.abilityGrid}>
                    {grouped[lvl].map((name) => (
                      <div key={name} className={styles.abilityCard}>
                        <Image
                          src={`/icons/${name}.png`}
                          alt={name}
                          width={24}
                          height={24}
                        />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
