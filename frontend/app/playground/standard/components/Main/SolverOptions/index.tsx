"use client";

import React from "react";
import styles from "./styles.module.css";

interface Props {
  coreAbilities: string[];
  enabledAbilities: Record<string, boolean>;
  setEnabledAbilities: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function SolverOptions({
  coreAbilities,
  enabledAbilities,
  setEnabledAbilities,
}: Props) {
  const toggleAbility = (ability: string) =>
    setEnabledAbilities((prev) => ({
      ...prev,
      [ability]: !prev[ability],
    }));

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>⚙️ 核心技能选择</h4>
      <div className={styles.iconRow}>
        {coreAbilities.map((ability) => {
          const isActive = enabledAbilities[ability] ?? true;
          return (
            <div
              key={ability}
              className={`${styles.iconBox} ${isActive ? styles.active : styles.inactive}`}
              onClick={() => toggleAbility(ability)}
              title={ability}
            >
              <img
                src={getAbilityIcon(ability)}
                alt={ability}
                className={styles.icon}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {isActive && <div className={styles.checkmark}>✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
