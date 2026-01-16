"use client";

import React, { useState } from "react";
import styles from "../../styles.module.css";
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

  // separate system — does NOT affect +/- editor
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
    } catch (err) {
      console.error("⚠️ Failed to update ability", ability, err);
    } finally {
      setLoadingAbility(null);
    }
  };

  /* =========================
     Display rule (KEY PART)
     ========================= */
  const isSearching = insertSearch.trim().length > 0;

  const displayAbilities = isSearching
    ? insertResults
    : insertResults.slice(0, 3); // 👈 preview list

  return (
    <div className={styles.insertSection}>
      {/* Search */}
      <input
        className={styles.search}
        placeholder="输入技能名 / 拼音..."
        value={insertSearch}
        onChange={(e) => setInsertSearch(e.target.value)}
      />

      {/* Placeholder when idle */}
      {!isSearching && insertResults.length > 3 && (
        <div className={styles.previewHint}>
        </div>
      )}

      {/* Ability list */}
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
                  ((e.currentTarget as HTMLImageElement).style.display = "none")
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
                置入一本十重
              </button>
            </div>
          </div>
        );
      })}

      {/* Empty search result */}
      {isSearching && displayAbilities.length === 0 && (
        <div className={styles.emptyHint}>
          未找到匹配技能
        </div>
      )}
    </div>
  );
}
