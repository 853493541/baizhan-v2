"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import bossData from "../../../../../../../../../data/boss_skills_collection_reward.json";

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

export default function ExtraModal({
  abilities,
  pinyinMap, // kept for compatibility, not used now
  onAdd,
  onClose,
}: {
  abilities: string[];
  pinyinMap: Record<string, { full: string; short: string }>;
  onAdd: (name: string, level: 9 | 10) => void;
  onClose: () => void;
}) {
  const [pendingAbility, setPendingAbility] = useState<string>("");

  // ✅ Filter out common abilities and display only the rest
  const modalGroups = useMemo(() => {
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalBody}>
          <div className={styles.abilityPanel}>
            {modalGroups.length === 0 && (
              <div className={styles.emptyNotice}>无其他可选技能</div>
            )}

            {modalGroups.map(({ boss, skills }) => (
              <div key={boss} className={styles.bossSection}>
                <div className={styles.bossName}>{boss}</div>
                <div className={styles.skillGrid}>
                  {skills.map((a) => (
                    <button
                      key={a}
                      onClick={() => setPendingAbility(a)}
                      className={`${styles.modalAbilityCard} ${
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

          <div className={styles.levelPanel}>
            {/* <div className={styles.levelLabel}>重数选择</div> */}
            <div className={styles.levelButtons}>
              {[9, 10].map((lvl) => (
                <button
                  key={lvl}
                  className={styles.levelBtn}
                  disabled={!pendingAbility}
                  onClick={() => {
                    onAdd(pendingAbility, lvl as 9 | 10);
                    onClose();
                  }}
                >
                  {lvl === 9 ? "九重" : "十重"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
