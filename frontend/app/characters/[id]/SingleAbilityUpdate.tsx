"use client";

import React, { useState } from "react";
import styles from "./SingleAbilityUpdate.module.css";
import { updateCharacterAbilities } from "@/lib/characterService"; // ✅ central helper

interface SingleAbilityUpdateProps {
  characterId: string;
  abilities: Record<string, number>;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}

export default function SingleAbilityUpdate({
  characterId,
  abilities,
  onAbilityUpdate,
}: SingleAbilityUpdateProps) {
  const [query, setQuery] = useState("");
  const [loadingAbility, setLoadingAbility] = useState<string | null>(null);

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLoadingAbility(ability);

    try {
      await updateCharacterAbilities(characterId, { [ability]: newLevel });
      onAbilityUpdate?.(ability, newLevel);
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    } finally {
      setLoadingAbility(null);
    }
  };

  const allAbilities = Object.keys(abilities);
  const results = allAbilities.filter((name) =>
    name.includes(query.trim())
  );

  return (
    <div>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
        单个技能更新
      </h3>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入技能名..."
        className={styles.searchInput}
      />

      <div className={styles.wrapper}>
        {results.map((name) => {
          const level = abilities[name] || 0;
          const iconPath = `/icons/${name}.png`;

          return (
            <div key={name} className={styles.abilityRow}>
              <img
                src={iconPath}
                alt={name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                }}
              />
              <span className={styles.name}>{name}</span>
              <div className={styles.controls}>
                <button
                  className={styles.minus}
                  disabled={loadingAbility === name}
                  onClick={() => updateAbility(name, level - 1)}
                >
                  -
                </button>
                <span className={styles.level}>{level}</span>
                <button
                  className={styles.plus}
                  disabled={loadingAbility === name}
                  onClick={() => updateAbility(name, level + 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {results.length === 0 && (
          <p style={{ color: "#666", fontSize: "13px" }}>未找到匹配技能</p>
        )}
      </div>
    </div>
  );
}
