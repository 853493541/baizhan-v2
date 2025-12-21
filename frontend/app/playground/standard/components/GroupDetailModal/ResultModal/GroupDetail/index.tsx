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
  { fullName: "黑煞落贪狼", shortName: "黑煞" },
  { fullName: "花钱消灾", shortName: "花钱" },
  { fullName: "引燃", shortName: "引燃" },
  { fullName: "一闪天诛", shortName: "天诛" },
  { fullName: "斗转金移", shortName: "斗转" },
  { fullName: "飞云回转刀", shortName: "飞刀" },
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

export default function GroupDetail({
  group,
  checkedAbilities,
}: Props) {
  /* ===============================
     Server resolution
  ================================ */
  const serverInfo = useMemo(() => {
    if (!group.characters || group.characters.length === 0) {
      return { text: "未知", color: "#666" };
    }

    const servers = new Set(
      group.characters
        .map((c: any) => c.server)
        .filter(Boolean)
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
     Core ability summary
  ================================ */
  const coreAbilitySummary = useMemo(() => {
    return CORE_ABILITIES.map((core) => ({
      fullName: core.fullName,
      shortName: core.shortName,
      count: allAbilityCounts[core.fullName] || 0,
    }));
  }, [allAbilityCounts]);

  /* ===============================
     Checked level-10 abilities
  ================================ */
  const checkedLv10Set = useMemo(() => {
    return new Set(
      checkedAbilities
        .filter((a) => a.level === 10)
        .map((a) => a.name)
    );
  }, [checkedAbilities]);

  /* ===============================
     Wasted abilities
  ================================ */
  const wastedAbilities = useMemo(() => {
    return HIGHLIGHT_ABILITIES
      .filter(
        (name) =>
          allAbilityCounts[name] === 3 &&
          checkedLv10Set.has(name)
      )
      .map((name) => ({
        fullName: name,
      }));
  }, [allAbilityCounts, checkedLv10Set]);

  return (
    <div className={styles.box}>
      <div className={styles.title}>分组信息</div>

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

      <div className={styles.sectionTitle}>
        已有十重核心技能
      </div>

      <div className={styles.abilityGrid}>
        {coreAbilitySummary.map((ab) => {
          let color: string | undefined;
          if (ab.count === 0) color = "#c0392b";
          if (ab.count === 3) color = "#1e8449";

          return (
            <div key={ab.fullName} className={styles.abilityItem}>
              <img
                src={getAbilityIcon(ab.fullName)}
                alt={ab.fullName}
                className={styles.abilityIcon}
              />
              <span
                className={styles.abilityText}
                style={{ color }}
              >
                {ab.shortName} × {ab.count}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.divider} />

      <div className={styles.sectionTitle}>十重浪费技能</div>

      {wastedAbilities.length === 0 ? (
        <div className={styles.emptyBox}>暂无浪费技能</div>
      ) : (
        /* ✅ 2 per row, full name */
        <div className={styles.abilityGrid}>
          {wastedAbilities.map((ab) => (
            <div key={ab.fullName} className={styles.abilityItem}>
              <img
                src={getAbilityIcon(ab.fullName)}
                alt={ab.fullName}
                className={styles.abilityIcon}
              />
              <span
                className={styles.abilityText}
                style={{ color: "#c0392b" }}
              >
                {ab.fullName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
