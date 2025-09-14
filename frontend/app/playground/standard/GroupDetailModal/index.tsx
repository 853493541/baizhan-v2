"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

import rawBossData from "../../data/boss_skills_collection_map.json";
const bossData: Record<string, string[]> = rawBossData;

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

// ✅ Inline QA checker
function checkGroupQA(
  group: GroupResult,
  conflictLevel: number,
  checkedAbilities: AbilityCheck[]
): string[] {
  const warnings: string[] = [];

  // 1. Healer present?
  if (!group.characters.some((c) => c.role === "Healer")) {
    warnings.push("缺少治疗");
  }

  // 2. Duplicate accounts
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of group.characters) {
    if (seen.has(c.account)) dups.add(c.account);
    seen.add(c.account);
  }
  if (dups.size > 0) {
    warnings.push(`重复账号: ${Array.from(dups).join("、")}`);
  }

  // 3. Ability conflicts
  const activeAbilities = checkedAbilities.filter((a) => a.available);
  const abilityCount: Record<string, number> = {};
  for (const c of group.characters) {
    for (const a of activeAbilities) {
      const lvl = c.abilities?.[a.name] ?? 0;
      if (lvl >= conflictLevel) {
        abilityCount[a.name] = (abilityCount[a.name] ?? 0) + 1;
      }
    }
  }

  for (const [ability, count] of Object.entries(abilityCount)) {
    if (count > 2) {
      warnings.push(`${ability} ${count}/2`);
    }
  }

  return warnings;
}

export default function GroupDetailModal({
  groupIndex,
  group,
  checkedAbilities,
  conflictLevel,
  onClose,
}: Props) {
  const [weeklyMap, setWeeklyMap] = useState<Record<number, string>>({});

  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

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

  const renderBossCard = (floor: number) => {
    const boss = weeklyMap[floor];
    if (!boss) {
      return (
        <div key={floor} className={styles.card}>
          <div className={styles.floorLabel}>{floor}</div>
          <div className={styles.noNeed}>未选择</div>
        </div>
      );
    }

    const dropList: string[] = bossData[boss] || [];
    const dropLevel = floor >= 81 && floor <= 90 ? 9 : 10;

    const needs = dropList
      .filter((ability) => !tradableSet.has(ability))
      .map((ability) => {
        const needCount = group.characters.filter(
          (c) => (c.abilities?.[ability] ?? 0) < dropLevel
        ).length;
        return needCount > 0 ? `${ability}（${needCount}）` : null;
      })
      .filter(Boolean);

    const content =
      needs.length > 0 ? (
        <ul className={styles.needList}>
          {needs.map((n, idx) => (
            <li key={idx}>{n}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.noNeed}>无需求</p>
      );

    return (
      <div key={floor} className={styles.card}>
        <div className={styles.floorLabel}>
          {floor} {boss}
        </div>
        {content}
      </div>
    );
  };

  const renderRow = (floors: number[]) => (
    <div className={styles.row}>
      {floors.map((f) => renderBossCard(f))}
    </div>
  );

  // ✅ Recompute warnings on the fly
  const qaWarnings = checkGroupQA(group, conflictLevel, checkedAbilities);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <h2>分组{groupIndex + 1}</h2>

        <h3>成员</h3>
        <ul className={styles.memberList}>
          {group.characters.map((c) => (
            <li key={c._id}>{c.name}</li>
          ))}
        </ul>

        <h3>核心技能详情</h3>
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

        <h3>警告</h3>
        {qaWarnings.length > 0 ? (
          <ul className={styles.warnList}>
            {qaWarnings.map((v, idx) => (
              <li key={idx}>⚠️ {v}</li>
            ))}
          </ul>
        ) : (
          <p>✅ 无</p>
        )}

        <h3>本周地图</h3>
        {renderRow(row1)}
        {renderRow(row2)}
      </div>
    </div>
  );
}
