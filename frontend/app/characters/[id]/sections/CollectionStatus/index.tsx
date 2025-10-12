"use client";

import React from "react";
import bossData from "@/app/data/boss_skills_collection_reward.json";
import bossCatalog from "@/app/data/boss_catalog.json";
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

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;
const formatAbilityName = (name: string) =>
  name.length === 5 ? name.slice(0, 4) : name;
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
        !(character.gender === "女" &&
          ["巨猿劈山", "顽抗", "蛮熊碎颅击"].includes(a))
    );
    return filtered.every((a) => (character.abilities[a] || 0) >= 10);
  };

  const bosses = Object.entries(bossData);
  const normalBosses = bosses.filter(([boss]) =>
    bossCatalog.normal.includes(boss)
  );
  const eliteBosses = bosses.filter(([boss]) =>
    bossCatalog.elite.includes(boss)
  );
  const challengeBosses = bosses.filter(([boss]) =>
    bossCatalog.challenge.includes(boss)
  );

  // 🧠 parse progress text like "3/4 九重"
  const parseProgress = (text: string) => {
    const match = text.match(/(\d+)\/(\d+)\s*([七八九十])重?/);
    if (!match) return { current: 0, total: 0, stageValue: 7 };
    const [, cur, total, stage] = match;
    const stageValue =
      stage === "十" ? 10 : stage === "九" ? 9 : stage === "八" ? 8 : 7;
    return { current: Number(cur), total: Number(total), stageValue };
  };

  // === Sorting: 八重 → 九重 → 十重 last ===
  const sortBosses = (list: [string, string[]][]) => {
    const inProgress = list.filter(([_, abilities]) => !isFullyCollected(abilities));
    const completed = list.filter(([_, abilities]) => isFullyCollected(abilities));

    inProgress.sort((a, b) => {
      const progressA = getBossProgress(a[1], character.abilities, character.gender);
      const progressB = getBossProgress(b[1], character.abilities, character.gender);
      const pa = parseProgress(progressA);
      const pb = parseProgress(progressB);

      if (pa.stageValue !== pb.stageValue) return pa.stageValue - pb.stageValue;
      const ratioA = pa.total ? pa.current / pa.total : 0;
      const ratioB = pb.total ? pb.current / pb.total : 0;
      if (ratioA !== ratioB) return ratioA - ratioB;
      return a[0].localeCompare(b[0], "zh");
    });

    completed.sort((a, b) => a[0].localeCompare(b[0], "zh"));
    return [...inProgress, ...completed];
  };

  const sortedNormal = sortBosses(normalBosses);
  const sortedElite = sortBosses(eliteBosses);
  const sortedChallenge = sortBosses(challengeBosses);

  const { energy, durability } = calculateStats(
    bossData,
    character.abilities,
    character.gender
  );

  const renderBossSection = (title: string, list: [string, string[]][]) => (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.cardGrid}>
        {list.map(([boss, abilities]) => {
          const progressRaw = getBossProgress(
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

          // 🟢 Replace text for completed bosses
          const progress = full ? "全收集" : progressRaw;

          // 🎨 Progress color logic
          let progressClass = "";
          if (progress.includes("十重") || full)
            progressClass = styles.progressGreen;
          else if (progress.includes("九重"))
            progressClass = styles.progressYellow;
          else progressClass = styles.progressPink;

          return (
            <div
              key={boss}
              className={`${styles.bossCard} ${
                full ? styles.bossCardComplete : ""
              }`}
            >
              <div className={styles.bossHeader}>
                <h3 className={styles.bossName}>{formatBossName(boss)}</h3>
                <span className={`${styles.bossProgress} ${progressClass}`}>
                  {progress}
                </span>
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

  return (
    <div className={styles.collectionStatus}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>收集状态</h2>
        <div className={styles.totalStats}>
          <span className={styles.energy}>精神: {energy}</span>
          <span className={styles.durability}>耐力: {durability}</span>
        </div>
      </div>

      {renderBossSection("普通 Boss", sortedNormal)}
      {renderBossSection("精英 Boss", sortedElite)}
      {renderBossSection("挑战 Boss", sortedChallenge)}
    </div>
  );
}
