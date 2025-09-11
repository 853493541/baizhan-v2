"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

// ✅ Boss drop data
import rawBossData from "../../data/boss_skills_collection_map.json";
const bossData: Record<string, string[]> = rawBossData;

// ✅ Tradable abilities list
import tradableAbilities from "../../data/tradable_abilities.json";
const tradableSet = new Set(tradableAbilities as string[]);

interface Props {
  groupIndex: number;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  conflictLevel: number;
  onClose: () => void;
}

interface WeeklyMapResponse {
  floors: Record<number, { boss: string }>;
}

export default function GroupDetailModal({
  groupIndex,
  group,
  checkedAbilities,
  conflictLevel,
  onClose,
}: Props) {
  const [weeklyMap, setWeeklyMap] = useState<Record<number, string>>({});

  // 🔹 Load weekly map from backend
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`);
        if (res.ok) {
          const data: WeeklyMapResponse = await res.json();
          const floors: Record<number, string> = {};
          for (const [floor, obj] of Object.entries(data.floors)) {
            floors[Number(floor)] = obj.boss;
          }
          setWeeklyMap(floors);
        }
      } catch (err) {
        console.error("❌ Failed to load weekly map:", err);
      }
    };

    fetchMap();
  }, []);

  // 🔹 Boss needs calculation
  const renderBossNeeds = () => {
    if (!Object.keys(weeklyMap).length) return <p>未找到本周Boss信息</p>;

    const withNeeds: JSX.Element[] = [];
    const wasted: JSX.Element[] = [];

    Object.entries(weeklyMap)
      .sort(([a], [b]) => Number(a) - Number(b)) // ✅ sort by floor
      .forEach(([floorStr, boss]) => {
        const floor = Number(floorStr);
        if (!boss) return;

        const dropList: string[] = bossData[boss] || [];
        const dropLevel = floor >= 81 && floor <= 90 ? 9 : 10; // ✅ floor → level

        const needs = dropList
          .filter((ability) => !tradableSet.has(ability)) // ✅ skip tradables
          .map((ability) => {
            const needCount = group.characters.filter(
              (c) => (c.abilities?.[ability] ?? 0) < dropLevel // ✅ FIXED rule
            ).length;
            return needCount > 0 ? `${ability}（${needCount}）` : null;
          })
          .filter(Boolean);

        if (needs.length > 0) {
          withNeeds.push(
            <div key={floor} className={styles.bossSection}>
              {floor} {boss}（{dropLevel}）: {needs.join("，")}
            </div>
          );
        } else {
          wasted.push(
            <div key={floor} className={`${styles.bossSection} ${styles.wasted}`}>
              {floor} {boss}（{dropLevel}）: ❌ 无人需要
            </div>
          );
        }
      });

    return (
      <>
        {withNeeds}
        {wasted.length > 0 && (
          <>
            <h4 style={{ color: "red" }}>⚠️ 全部浪费的掉落</h4>
            {wasted}
          </>
        )}
      </>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <h2>分组详情 - Group {groupIndex + 1}</h2>

        <h3>成员 ({group.characters.length})</h3>
        <ul className={styles.memberList}>
          {group.characters.map((c) => (
            <li key={c._id}>{c.name}</li>
          ))}
        </ul>

        <h3>核心技能详情 (Lv{conflictLevel}+)</h3>
        <table className={styles.abilityTable}>
          <thead>
            <tr>
              <th>技能</th>
              {group.characters.map((c) => (
                <th key={c._id}>{c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checkedAbilities.map((a, idx) => (
              <tr key={idx}>
                <td>{a.name}</td>
                {group.characters.map((c) => {
                  const lvl = c.abilities?.[a.name] ?? 0;
                  const reached = lvl >= conflictLevel;
                  return (
                    <td
                      key={c._id}
                      className={reached ? styles.reached : ""}
                    >
                      {lvl > 0 ? `Lv${lvl}` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <h3>违规/警告</h3>
        {group.violations.length > 0 ? (
          <ul className={styles.warnList}>
            {group.violations.map((v, idx) => (
              <li key={idx}>⚠️ {v}</li>
            ))}
          </ul>
        ) : (
          <p>✅ 无</p>
        )}

        <h3>📌 本周Boss掉落</h3>
        {renderBossNeeds()}
      </div>
    </div>
  );
}
