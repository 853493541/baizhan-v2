"use client";

import React, { useMemo } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

interface Props {
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
}

const getAbilityIcon = (fullName: string) => `/icons/${fullName}.png`;

/* ===============================
   Core abilities (fixed set)
================================ */
const CORE_ABILITIES = [
  { fullName: "黑煞落贪狼" },
  { fullName: "花钱消灾" },
  { fullName: "引燃" },
  { fullName: "一闪天诛" },
  { fullName: "斗转金移" },
  { fullName: "飞云回转刀" },
];

/* ===============================
   Wasted-skill candidate list
================================ */
const HIGHLIGHT_ABILITIES = [
  "花钱消灾",
  "斗转金移",
  "特制金创药",
  "万花金创药",
  "一闪天诛",
  "初景白雨",
  "漾剑式",
  "定波式",
  "黑煞落贪狼",
  "毓秀灵药",
  "霞月长针",
  "剑心通明",
  "飞云回转刀",
  "阴阳术退散",
  "尸鬼封烬",
  "兔死狐悲",
  "血龙甩尾",
  "七荒黑牙",
  "三个铜钱",
  "乾坤一掷",
  "厄毒爆发",
  "坠龙惊鸿",
  "引燃",
  "火焰之种",
  "阴雷之种",
  "短歌万劫",
  "泉映幻歌",
];

export default function GroupDetail({ group, checkedAbilities }: Props) {
  /* ===============================
     Server resolution
  ================================ */
  const serverInfo = useMemo(() => {
    if (!group.characters || group.characters.length === 0) {
      return { text: "未知", color: "#666" };
    }

    const servers = new Set(
      group.characters.map((c: any) => c.server).filter(Boolean)
    );

    if (servers.size === 1) {
      return { text: [...servers][0], color: "#1e8449" };
    }

    return { text: "跨服", color: "#c0392b" };
  }, [group.characters]);

  /* ===============================
     Count owned level-10 abilities
  ================================ */
  const allAbilityCounts = useMemo(() => {
    const counter: Record<string, number> = {};
    if (!group.characters) return counter;

    for (const char of group.characters as any[]) {
      if (!char?.abilities) continue;

      for (const [ability, level] of Object.entries(
        char.abilities as Record<string, number>
      )) {
        if (level === 10) {
          counter[ability] = (counter[ability] || 0) + 1;
        }
      }
    }
    return counter;
  }, [group.characters]);

  /* ===============================
     Checked level-10 abilities
  ================================ */
  const checkedLv10Set = useMemo(
    () =>
      new Set(
        checkedAbilities
          .filter((a) => a.level === 10)
          .map((a) => a.name)
      ),
    [checkedAbilities]
  );

  /* ===============================
     Core abilities with counts
  ================================ */
  const coreAbilities = useMemo(
    () =>
      CORE_ABILITIES.map((ab) => ({
        name: ab.fullName,
        count: allAbilityCounts[ab.fullName] || 0,
      })),
    [allAbilityCounts]
  );

  /* ===============================
     Wasted abilities
  ================================ */
  const wastedAbilities = useMemo(
    () =>
      HIGHLIGHT_ABILITIES.filter(
        (name) =>
          allAbilityCounts[name] === 3 &&
          checkedLv10Set.has(name)
      ),
    [allAbilityCounts, checkedLv10Set]
  );

  /* ===============================
     Core ability UI state
  ================================ */
  const getCoreStateClass = (count: number) => {
    if (count === 0) return styles.coreMissing;
    if (count === 3) return styles.coreFull;
    return styles.corePartial;
  };

  return (
    <div className={styles.box}>
      <div className={styles.title}>信息</div>

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.label}>服务器</span>
          <span
            className={styles.value}
            style={{ color: serverInfo.color }}
          >
            {serverInfo.text}
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ===============================
          核心技能
      ================================ */}
      <div className={styles.sectionTitle}>核心技能</div>

      <div className={`${styles.abilityGrid} ${styles.coreGrid}`}>
        {coreAbilities.map((ab) => (
          <div
            key={ab.name}
            className={`${styles.abilityItem} ${getCoreStateClass(ab.count)}`}
            title={`${ab.name} × ${ab.count}`}
          >
            <img
              src={getAbilityIcon(ab.name)}
              alt={ab.name}
              className={styles.coreIcon}
            />
            <span className={styles.abilityText}>
              × {ab.count}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      {/* ===============================
          浪费技能
      ================================ */}
      <div className={styles.sectionTitle}>浪费</div>

      {wastedAbilities.length === 0 ? (
        <div className={styles.emptyBox}>无浪费技能</div>
      ) : (
        <div className={styles.wastedRow}>
          {wastedAbilities.map((name) => (
            <div
              key={name}
              className={styles.abilityItem}
              title={name}
            >
              <img
                src={getAbilityIcon(name)}
                alt={name}
                className={styles.wastedIcon}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
