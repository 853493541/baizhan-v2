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
  setSelectedAbility,
  selectedLevel,
  setSelectedLevel,
}: {
  abilities: string[];
  selectedAbility: string;
  setSelectedAbility: (a: string) => void;
  selectedLevel: 9 | 10 | null;
  setSelectedLevel: (l: 9 | 10) => void;
}) {
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  /* ----------------------------------------------------------------------
     🧩 Build pinyin map once
  ---------------------------------------------------------------------- */
  useEffect(() => {
    async function buildMap() {
      if (!abilities.length) return;
      const map = await createPinyinMap(abilities);
      setPinyinMap(map);
    }
    buildMap();
  }, [abilities]);

  /* ----------------------------------------------------------------------
     🧮 Group abilities by boss (excluding common)
  ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     🔍 Modal filtered list
  ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     🧱 Common abilities (main page)
  ---------------------------------------------------------------------- */
  const availableNames = new Set(abilities);
  const commonList = COMMON_ABILITIES.filter((a) => availableNames.has(a));

  /* ----------------------------------------------------------------------
     🖼️ Render
  ---------------------------------------------------------------------- */
  return (
    <div className={styles.leftColumn}>
      {/* === 🟩 Section: 常见掉落 === */}
      {commonList.length > 0 && (
        <>
          <div className={styles.sectionDivider}>常见掉落</div>
          <div className={styles.commonList}>
            {commonList.map((a) => (
              <button
                key={a}
                onClick={() => {
                  setSelectedAbility(a);
                  setSelectedLevel(10); // ✅ always 10重
                }}
                className={`${styles.abilityCard} ${
                  selectedAbility === a ? styles.active : ""
                }`}
              >
                <Image
                  src={`/icons/${a}.png`}
                  alt={a}
                  width={26}
                  height={26}
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                  className={styles.icon}
                />
                <span className={styles.abilityName}>{a}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* === 🟦 Section: 选择技能 === */}
      <div className={styles.sectionDivider}>选择技能</div>
      <button
        className={styles.openModalBtn}
        onClick={() => setIsModalOpen(true)}
      >
        选择技能 ({abilities.length})
      </button>

      {/* === 🪟 Modal === */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className={styles.modalList}>
              {modalFilteredGroups.map(({ boss, skills }) => (
                <div key={boss} className={styles.bossSection}>
                  <div className={styles.bossName}>{boss}</div>

                  <div className={styles.skillGrid}>
                    {skills.map((a) => {
                      const isCommon = COMMON_ABILITIES.includes(a);
                      const isSelected = selectedAbility === a;

                      return (
                        <div key={a} className={styles.skillRow}>
                          <button
                            onClick={() => {
                              setSelectedAbility(a);
                              if (isCommon) {
                                setSelectedLevel(10);
                                setIsModalOpen(false);
                              }
                            }}
                            className={`${styles.abilityCard} ${
                              isSelected ? styles.active : ""
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

                          {/* Inline level buttons for non-common */}
                          {!isCommon && (
                            <div className={styles.levelButtons}>
                              {[9, 10].map((lvl) => (
                                <button
                                  key={lvl}
                                  className={`${styles.levelBtn} ${
                                    isSelected && selectedLevel === lvl
                                      ? styles.activeLevel
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedAbility(a);
                                    setSelectedLevel(lvl as 9 | 10);
                                    setIsModalOpen(false);
                                  }}
                                >
                                  {lvl === 9 ? "九" : "十"}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {modalFilteredGroups.length === 0 && (
                <p className={styles.noResult}>未找到匹配技能</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
