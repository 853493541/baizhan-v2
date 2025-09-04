"use client";

import React from "react";
import bossData from "@/app/data/boss_skills_collection_reward.json";
import "./CollectionStatus.css";

interface Character {
  _id: string;
  name: string;
  gender: "男" | "女";
  abilities: Record<string, number>; // ability name → level (1–11)
}

interface Props {
  character: Character;
}

export default function CollectionStatus({ character }: Props) {
  const genderRules = {
    男: { ignore: ["剑心通明", "帝骖龙翔"] },
    女: { ignore: ["巨猿劈山", "顽抗"] },
  };

  const ignoreList = genderRules[character.gender].ignore;

  const toChineseTier = (n: number) => {
    const numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    return `${numerals[n]}重`;
  };

  const getNextTier = (abilities: string[]) => {
    const filtered = abilities.filter((a) => !ignoreList.includes(a));
    const levels = filtered.map((a) => character.abilities[a] || 0);
    const maxTier = 10;

    let nextTier = 1;
    for (let tier = 1; tier <= maxTier; tier++) {
      const allReached = levels.every((lv) => lv >= tier);
      if (!allReached) {
        nextTier = tier;
        break;
      }
      if (tier === maxTier) {
        nextTier = maxTier;
      }
    }
    return nextTier;
  };

  const getBossProgress = (abilities: string[]) => {
    const nextTier = getNextTier(abilities);
    const filtered = abilities.filter((a) => !ignoreList.includes(a));
    const levels = filtered.map((a) => character.abilities[a] || 0);
    const owned = levels.filter((lv) => lv >= nextTier).length;
    return `${owned}/${filtered.length} ${toChineseTier(nextTier)}`;
  };

  return (
    <div className="collection-status">
      <h2 className="title">Collection Status</h2>
      <div className="card-grid">
        {Object.entries(bossData)
          .sort((a, b) => {
            const tierA = getNextTier(a[1]);
            const tierB = getNextTier(b[1]);
            if (tierA !== tierB) {
              return tierB - tierA;
            }
            return a[0].localeCompare(b[0], "zh");
          })
          .map(([boss, abilities]) => (
            <div key={boss} className="boss-card">
              <h3 className="boss-name">{boss}</h3>
              <p className="boss-progress">{getBossProgress(abilities)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
