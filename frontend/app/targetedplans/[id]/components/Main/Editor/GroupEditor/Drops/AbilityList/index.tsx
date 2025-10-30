"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
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
  const [modalSearch, setModalSearch] = useState("");
  const [pendingAbility, setPendingAbility] = useState<string>("");

  const [displayedAbilities, setDisplayedAbilities] = useState<
    { name: string; level: 9 | 10 }[]
  >([]);

  /* build pinyin map */
  useEffect(() => {
    async function buildMap() {
      if (!abilities.length) return;
      const map = await createPinyinMap(abilities);
      setPinyinMap(map);
    }
    buildMap();
  }, [abilities]);

  /* group by boss */
  const groupedAbilities = useMemo(() => {
    const all: { boss: string; skills: string[] }[] = [];
    for (const [bossRaw, skills] of Object.entries(bossData)) {
      const boss = bossRaw.includes("、")
        ? bossRaw.split("、").pop()!.trim()
        : bossRaw;
      const valid = skills.filter(
        (s) => abilities.includes(s) && !COMMON_ABILITIES.includes(s)
      );
      if (valid.length > 0) all.push({ boss, skills: valid });
    }
    return all;
  }, [abilities]);

  /* modal filter */
  const modalFilteredGroups = useMemo(() => {
    const term = modalSearch.trim().toLowerCase();
    if (!term) return groupedAbilities;
    const filtered: { boss: string; skills: string[] }[] = [];
    for (const [bossRaw, skills] of Object.entries(bossData)) {
      const boss = bossRaw.includes("、")
        ? bossRaw.split("、").pop()!.trim()
        : bossRaw;
      const valid = pinyinFilter(
        skills.filter(
          (s) => abilities.includes(s) && !COMMON_ABILITIES.includes(s)
        ),
        pinyinMap,
        term
      );
      if (valid.length > 0) filtered.push({ boss, skills: valid });
    }
    return filtered;
  }, [modalSearch, groupedAbilities, pinyinMap, abilities]);

  /* initialize with common 10重 */
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
    setPendingAbility("");
    setModalSearch("");
    setIsModalOpen(false);
  };

  /* render */
  return (
    <div className={styles.leftColumn}>
      <div className={styles.sectionDivider}>常见掉落</div>
      <div className={styles.commonList}>
        {displayedAbilities.map((a) => (
          <button
            key={a.name}
            className={`${styles.abilityCard} ${
              selectedAbility === a.name ? styles.active : ""
            }`}
            onClick={() => onAbilitySelect(a.name, a.level)}
          >
            <Image
              src={`/icons/${a.name}.png`}
              alt={a.name}
              width={26}
              height={26}
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
              className={styles.icon}
            />
            <span className={styles.abilityName}>
              {a.name}
              <span className={styles.abilityLevel}>
                {a.level === 9 ? "九重" : "十重"}
              </span>
            </span>
          </button>
        ))}

        {/* Add new */}
        <button
          className={styles.addAbilityBtn}
          onClick={() => setIsModalOpen(true)}
        >
          ＋ 添加技能
        </button>
      </div>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="输入技能名 / 拼音搜索..."
                className={styles.searchInput}
              />
              <button
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* abilities */}
              <div className={styles.abilityPanel}>
                {modalFilteredGroups.map(({ boss, skills }) => (
                  <div key={boss} className={styles.bossSection}>
                    <div className={styles.bossName}>{boss}</div>
                    <div className={styles.skillGrid}>
                      {skills.map((a) => (
                        <button
                          key={a}
                          onClick={() => setPendingAbility(a)}
                          className={`${styles.abilityCard} ${
                            pendingAbility === a ? styles.active : ""
                          }`}
                        >
                          <Image
                            src={`/icons/${a}.png`}
                            alt={a}
                            width={22}
                            height={22}
                            onError={(e) =>
                              ((e.target as HTMLImageElement).style.display =
                                "none")
                            }
                            className={styles.icon}
                          />
                          <span className={styles.abilityName}>
                            {a.length > 2 ? a.slice(0, 2) : a}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* level picker */}
              <div className={styles.levelPanel}>
                <div className={styles.levelLabel}>重数选择</div>
                <div className={styles.levelButtons}>
                  {[9, 10].map((lvl) => (
                    <button
                      key={lvl}
                      className={styles.levelBtn}
                      disabled={!pendingAbility}
                      onClick={() => handleAddAbility(pendingAbility, lvl as 9 | 10)}
                    >
                      {lvl === 9 ? "九重" : "十重"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
