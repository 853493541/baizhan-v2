"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";

interface CharacterAbilitiesProps {
  abilities: Record<string, number>;
}

const levelOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function CharacterAbilities({ abilities }: CharacterAbilitiesProps) {
  const [showAbilities, setShowAbilities] = useState(false);

  // Group abilities by level
  const grouped: Record<number, string[]> = {};
  for (const [name, value] of Object.entries(abilities)) {
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(name);
  }

  for (const lvl of Object.keys(grouped)) {
    grouped[Number(lvl)].sort();
  }

  if (!showAbilities) {
    return (
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setShowAbilities(true)}
          className={styles.showButton}
        >
          显示全部技能
        </button>
      </div>
    );
  }

  return (
    <div className={styles.abilitiesWrapper}>
      {levelOrder.map((lvl) => {
        if (!grouped[lvl] || grouped[lvl].length === 0) return null;
        return (
          <div key={lvl}>
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
  );
}
