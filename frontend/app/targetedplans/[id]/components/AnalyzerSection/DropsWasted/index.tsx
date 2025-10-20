"use client";

import React, { useEffect, useMemo, useState } from "react";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";
import Image from "next/image";
import styles from "./styles.module.css";

interface Props {
  groups?: GroupResult[];
  checkedAbilities: AbilityCheck[];
}

type LevelTab = 9 | 10;

// ✅ Core abilities list
const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
  "飞云回转刀",
  "厄毒爆发",
  "短歌万劫",
  "乾坤一掷",
];

export default function DropsWasted({ groups = [], checkedAbilities }: Props) {
  const [activeLevel, setActiveLevel] = useState<LevelTab>(10);
  const [wasted, setWasted] = useState<{ wasted9: number; wasted10: number } | null>(
    null
  );

  useEffect(() => {
    if (!groups.length) return;
    summarizeAftermath(groups)
      .then(setWasted)
      .catch((err) => {
        console.error("❌ summarizeAftermath failed:", err);
        setWasted(null);
      });
  }, [groups]);

  const availableAbilities = useMemo(
    () =>
      checkedAbilities
        .filter((a) => a.available)
        .map((a) => ({ name: a.name, level: a.level })),
    [checkedAbilities]
  );

  const ownsForLevel = (charLvl: number, targetLevel: 9 | 10) =>
    targetLevel === 9 ? charLvl >= 9 : charLvl === 10;

  const abilitiesByLevel = useMemo(() => {
    const level9 = new Set<string>();
    const level10 = new Set<string>();
    for (const g of groups) {
      for (const c of g.characters) {
        for (const { name, level } of availableAbilities) {
          const lvl = c.abilities?.[name] ?? 0;
          if (level === 9 && ownsForLevel(lvl, 9)) level9.add(name);
          if (level === 10 && ownsForLevel(lvl, 10)) level10.add(name);
        }
      }
    }
    return {
      level9: Array.from(level9),
      level10: Array.from(level10),
    };
  }, [groups, availableAbilities]);

  // 🧮 Split core vs other wasted abilities
  const groupWasteIcons = useMemo(() => {
    const res: Record<string, { core: string[]; other: string[] }> = {};
    const abilities =
      activeLevel === 9 ? abilitiesByLevel.level9 : abilitiesByLevel.level10;

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const coreWaste: string[] = [];
      const otherWaste: string[] = [];

      for (const ability of abilities) {
        const owners = g.characters.filter((c: Character) =>
          ownsForLevel(c.abilities?.[ability] ?? 0, activeLevel)
        );
        if (owners.length > 2) {
          if (CORE_ABILITIES.includes(ability)) coreWaste.push(ability);
          else otherWaste.push(ability);
        }
      }

      res[`group${i + 1}`] = { core: coreWaste, other: otherWaste };
    }
    return res;
  }, [groups, activeLevel, abilitiesByLevel]);

  if (!groups.length) return <p className={styles.loading}>暂无组别数据</p>;

  return (
    <div className={styles.container}>
      {/* === Top bar (no title) === */}
      <div className={styles.topBar}>
        {/* ⬅️ Level tabs on left */}
        <div className={styles.levelTabs}>
          <button
            className={`${styles.levelBtn} ${activeLevel === 10 ? styles.active : ""}`}
            onClick={() => setActiveLevel(10)}
          >
            10重
          </button>
          <button
            className={`${styles.levelBtn} ${activeLevel === 9 ? styles.active : ""}`}
            onClick={() => setActiveLevel(9)}
          >
            9重
          </button>
        </div>

        {/* ➡️ Summary on right */}
        {wasted && (
          <div className={styles.summaryLeft}>
            <span className={styles.label}>9重浪费总数：</span>
            <span className={styles.valueRed}>{wasted.wasted9}</span>
            <span className={styles.divider}> | </span>
            <span className={styles.label}>10重浪费总数：</span>
            <span className={styles.valueGold}>{wasted.wasted10}</span>
          </div>
        )}
      </div>

      {/* === Table Layout === */}
      <div className={styles.tableWrapper}>
        <table className={styles.wasteTable}>
          <thead>
            <tr>
              <th>  </th>
              <th>浪费技能</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, idx) => {
              const { core, other } = groupWasteIcons[`group${idx + 1}`] || {
                core: [],
                other: [],
              };
              const hasWaste = core.length > 0 || other.length > 0;

              return (
                <tr key={idx}>
                  <td className={styles.groupCol}>组 {idx + 1}</td>
                  <td className={styles.iconCol}>
                    {hasWaste ? (
                      <>
                        {/* Core abilities first */}
                        {core.map((a, i) => (
                          <Image
                            key={`core-${i}`}
                            src={`/icons/${a}.png`}
                            alt={a}
                            width={26}
                            height={26}
                            className={`${styles.abilityIcon} ${styles.coreIcon}`}
                            title={a}
                            onError={(e) =>
                              ((e.target as HTMLImageElement).style.display = "none")
                            }
                          />
                        ))}

                        {/* Separator */}
                        {core.length > 0 && other.length > 0 && (
                          <span className={styles.pipe}>|</span>
                        )}

                        {/* Other abilities */}
                        {other.map((a, i) => (
                          <Image
                            key={`other-${i}`}
                            src={`/icons/${a}.png`}
                            alt={a}
                            width={26}
                            height={26}
                            className={styles.abilityIcon}
                            title={a}
                            onError={(e) =>
                              ((e.target as HTMLImageElement).style.display = "none")
                            }
                          />
                        ))}
                      </>
                    ) : (
                      <span className={styles.noWaste}>（无浪费）</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
