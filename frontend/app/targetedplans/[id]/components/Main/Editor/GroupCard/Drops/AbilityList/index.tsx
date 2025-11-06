"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import ExtraModal from "./ExtraModal";
import bossData from "../../../../../../../../data/boss_skills_collection_reward.json";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

const COMMON_ABILITIES = [
  "流霞点绛",
  "霞袖回春",
  "云海听弦",
  "无我无剑式",
  "三环套月式",
  "月流斩",
  "退山凝",
  "电挈昆吾",
  "震岳势",
];

export default function AbilityList({
  abilities,
  selectedAbility,
  selectedLevel,
  onAbilitySelect,
  onAddOption,
}: {
  abilities: string[];
  selectedAbility: string;
  selectedLevel: 9 | 10 | null;
  onAbilitySelect: (name: string, level: 9 | 10) => void;
  onAddOption: (name: string, level: 9 | 10) => void;
}) {
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [displayedAbilities, setDisplayedAbilities] = useState<
    { name: string; level: 9 | 10 }[]
  >([]);

  /* Build pinyin map */
  useEffect(() => {
    async function buildMap() {
      if (!abilities.length) return;
      const map = await createPinyinMap(abilities);
      setPinyinMap(map);
    }
    buildMap();
  }, [abilities]);

  /* Initialize with common abilities */
  useEffect(() => {
    const commons = COMMON_ABILITIES.filter((a) =>
      abilities.includes(a)
    ).map((name) => ({
      name,
      level: 10 as 9 | 10,
    }));
    setDisplayedAbilities(commons);
  }, [abilities]);

  const handleAddAbility = (name: string, level: 9 | 10) => {
    setDisplayedAbilities((prev) => {
      if (prev.some((a) => a.name === name && a.level === level)) return prev;
      return [...prev, { name, level }];
    });
    onAddOption(name, level);
  };

  return (
    <div className={styles.leftColumn}>
      {/* === Section Divider Header === */}
      <div className={styles.sectionDivider}>技能</div>

      {/* === Ability List === */}
      <div className={styles.abilityList}>
        {displayedAbilities.map((a) => {
          const isSelected =
            selectedAbility === a.name && selectedLevel === a.level;
          return (
            <button
              key={`${a.name}-${a.level}`}
              className={`${styles.abilityRow} ${
                isSelected ? styles.active : ""
              }`}
              onClick={() => onAbilitySelect(a.name, a.level)}
            >
              <div className={styles.iconWrap}>
                <Image
                  src={`/icons/${a.name}.png`}
                  alt={a.name}
                  width={20}
                  height={20}
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                  className={styles.icon}
                />
              </div>
              <div className={styles.textWrap}>
                <div className={styles.abilityLabel}>
                  {COMMON_ABILITIES.includes(a.name)
                    ? a.name
                    : `${a.level === 10 ? "十重" : "九重"}·${a.name}`}
                </div>
              </div>
            </button>
          );
        })}

        <button
          className={styles.addAbilityBtn}
          onClick={() => setIsModalOpen(true)}
        >
          ＋ 更多技能
        </button>
      </div>

      {/* === Extra Modal === */}
      {isModalOpen && (
        <ExtraModal
          abilities={abilities}
          pinyinMap={pinyinMap}
          onAdd={handleAddAbility}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
