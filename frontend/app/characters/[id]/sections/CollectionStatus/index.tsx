"use client";

import React from "react";
import bossData from "@/app/data/boss_skills_collection_reward.json";
import {
  getBossProgress,
  getMissingForNextTier,
  getNextTier,
  calculateStats,
} from "@/utils/collectionUtils";
import styles from "./styles.module.css";

interface Character {
  _id: string;
  name: string;
  gender: "男" | "女";
  abilities: Record<string, number>;
}

interface Props {
  character: Character;
}

// Helper: get icon path
const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

// Helper: format ability name (truncate if exactly 5 chars)
const formatAbilityName = (name: string) =>
  name.length === 5 ? name.slice(0, 4) : name;

// Helper: format boss name
const formatBossName = (name: string) => {
  if (name.includes("武逸青、胡鞑、萧沙")) return "萧沙";
  if (name.includes("钱宗龙、杜姬欣")) return "钱宗龙";
  return name;
};

export default function CollectionStatus({ character }: Props) {
  const isFullyCollected = (abilities: string[]) => {
    const filtered = abilities.filter(
      (a) =>
        !(character.gender === "男" && ["剑心通明", "帝骖龙翔"].includes(a)) &&
        !(character.gender === "女" && ["巨猿劈山", "顽抗", "蛮熊碎颅击"].includes(a))
    );
    return filtered.every((a) => (character.abilities[a] || 0) >= 10);
  };

  // Sort bosses into in-progress vs complete
  const bosses = Object.entries(bossData);
  const inProgress = bosses.filter(([_, abilities]) => !isFullyCollected(abilities));
  const completed = bosses.filter(([_, abilities]) => isFullyCollected(abilities));

  inProgress.sort((a, b) => {
    const tierA = getNextTier(a[1], character.abilities, character.gender);
    const tierB = getNextTier(b[1], character.abilities, character.gender);
    if (tierA !== tierB) return tierB - tierA;
    return a[0].localeCompare(b[0], "zh");
  });
  completed.sort((a, b) => a[0].localeCompare(b[0], "zh"));

  // Calculate total stats
  const { energy, durability } = calculateStats(
    bossData,
    character.abilities,
    character.gender
  );

  return (
    <div className={styles.collectionStatus}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>收集状态</h2>
        <div className={styles.totalStats}>
          <span className={styles.energy}>精神: {energy}</span>
          <span className={styles.durability}>耐力: {durability}</span>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {[...inProgress, ...completed].map(([boss, abilities]) => {
          const progress = getBossProgress(
            abilities,
            character.abilities,
            character.gender
          );
          const missing = getMissingForNextTier(
            abilities,
            character.abilities,
            character.gender
          );
          const full = isFullyCollected(abilities);

          return (
            <div
              key={boss}
              className={`${styles.bossCard} ${
                full ? styles.bossCardComplete : ""
              }`}
            >
              <div className={styles.bossHeader}>
                <h3 className={styles.bossName}>{formatBossName(boss)}</h3>
                <span className={styles.bossProgress}>{progress}</span>
              </div>

              {!full && missing.length > 0 && (
                <div className={styles.missingGrid}>
                  {missing.map((ability) => (
                    <div key={ability} className={styles.abilityItem}>
                      <img
                        src={getAbilityIcon(ability)}
                        alt={ability}
                        className={styles.abilityIcon}
                      />
                      <span className={styles.abilityName}>
                        {formatAbilityName(ability)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
