"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import { updateCharacterAbilities } from "@/lib/characterService";

interface Props {
  characterId: string;

  insertSearch: string;
  setInsertSearch: (v: string) => void;

  insertResults: string[];
  insertLevels: Record<string, number>;
  setInsertLevels: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;

  getInsertLevel: (ability: string) => number;
  addLevel10Book: (ability: string, level: number) => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function ModifySection({
  characterId,
  insertSearch,
  setInsertSearch,
  insertResults,
  setInsertLevels,
  getInsertLevel,
  addLevel10Book,
}: Props) {
  const [loadingAbility, setLoadingAbility] = useState<string | null>(null);

  /* =========================
     Editor logic
     ========================= */
  const updateAbility = async (ability: string, nextLevel: number) => {
    if (!characterId) return;
    if (nextLevel < 0 || nextLevel > 10) return;

    const currentLevel = getInsertLevel(ability);
    if (currentLevel === nextLevel) return;
    if (loadingAbility === ability) return;

    setLoadingAbility(ability);
    try {
      await updateCharacterAbilities(characterId, {
        [ability]: nextLevel,
      });

      setInsertLevels((prev) => ({
        ...prev,
        [ability]: nextLevel,
      }));
    } finally {
      setLoadingAbility(null);
    }
  };

  /* =========================
     Display rule
     ========================= */
  const isSearching = insertSearch.trim().length > 0;
  const displayAbilities = isSearching
    ? insertResults
    : insertResults.slice(0, 3);

  return (
    <div className={styles.insertSection}>
      {/* Search */}
      <input
        className={styles.search}
        placeholder="输入技能名 / 拼音..."
        value={insertSearch}
        onChange={(e) => setInsertSearch(e.target.value)}
      />

      {/* Preview hint */}

      {/* 🔒 SCROLL CONTAINER (KEY FIX) */}
      <div className={styles.resultList}>
        {displayAbilities.map((ability) => {
          const level = getInsertLevel(ability);
          const isLoading = loadingAbility === ability;

          return (
            <div key={ability} className={styles.abilityRow}>
              <div className={styles.itemLeft}>
                <img
                  src={getAbilityIcon(ability)}
                  alt={ability}
                  className={styles.abilityIcon}
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display =
                      "none")
                  }
                />
                <span className={styles.abilityName}>{ability}</span>
              </div>

              <div className={styles.buttons}>
                <button
                  className={`${styles.btn} ${styles.minus}`}
                  disabled={isLoading || level <= 0}
                  onClick={() => updateAbility(ability, level - 1)}
                >
                  −
                </button>

                <span className={styles.level}>{level}</span>

                <button
                  className={`${styles.btn} ${styles.plus}`}
                  disabled={isLoading || level >= 10}
                  onClick={() => updateAbility(ability, level + 1)}
                >
                  +
                </button>

                <button
                  className={styles.insertBtn}
                  disabled={isLoading}
                  onClick={() => addLevel10Book(ability, level)}
                >
                  置入十重
                </button>
              </div>
            </div>
          );
        })}

        {isSearching && displayAbilities.length === 0 && (
          <div className={styles.emptyHint}>未找到匹配技能</div>
        )}
      </div>
    </div>
  );
}
