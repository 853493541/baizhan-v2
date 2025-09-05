"use client";

import React from "react";
import bossData from "@/app/data/boss_skills_collection_reward.json";
import {
  getBossProgress,
  getMissingForNextTier,
  getNextTier,
} from "@/utils/collectionUtils";
import "./CollectionStatus.css";

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
const formatAbilityName = (name: string) => {
  if (name.length === 5) {
    return name.slice(0, 4);
  }
  return name;
};

// Helper: format boss name (special rule for 萧沙)
const formatBossName = (name: string) => {
  if (name.includes("武逸青、胡鞑、萧沙")) {
    return "萧沙"; // ✅ special-case rename
  }
    if (name.includes("钱宗龙、杜姬欣")) {
    return "钱宗龙"; // ✅ special-case rename
  }
  return name;
};

export default function CollectionStatus({ character }: Props) {
  // check if a boss is fully collected at level 10
  const isFullyCollected = (abilities: string[]) => {
    const filtered = abilities.filter(
      (a) =>
        !(character.gender === "男" && ["剑心通明", "帝骖龙翔"].includes(a)) &&
        !(character.gender === "女" && ["巨猿劈山", "顽抗"].includes(a))
    );
    return filtered.every((a) => (character.abilities[a] || 0) >= 10);
  };

  const bosses = Object.entries(bossData);
  const inProgress = bosses.filter(([_, abilities]) => !isFullyCollected(abilities));
  const completed = bosses.filter(([_, abilities]) => isFullyCollected(abilities));

  // sort in-progress bosses
  inProgress.sort((a, b) => {
    const tierA = getNextTier(a[1], character.abilities, character.gender);
    const tierB = getNextTier(b[1], character.abilities, character.gender);
    if (tierA !== tierB) return tierB - tierA;
    return a[0].localeCompare(b[0], "zh");
  });

  completed.sort((a, b) => a[0].localeCompare(b[0], "zh"));

  return (
    <div className="collection-status">
      <h2 className="title">收集状态</h2>
      <div className="card-grid">
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
              className={`boss-card ${full ? "boss-card-complete" : ""}`}
            >
              <div className="boss-header">
                <h3 className="boss-name">{formatBossName(boss)}</h3>
                <span className="boss-progress">{progress}</span>
              </div>

              {!full && missing.length > 0 && (
                <div className="missing-grid">
                  {missing.map((ability) => (
                    <div key={ability} className="ability-item">
                      <img
                        src={getAbilityIcon(ability)}
                        alt={ability}
                        className="ability-icon"
                      />
                      <span className="ability-name">
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
