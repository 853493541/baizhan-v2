"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

import rawBossData from "@/app/data/boss_skills_collection_map.json";
const bossData: Record<string, string[]> = rawBossData;

import tradableAbilities from "@/app//data/tradable_abilities.json";
const tradableSet = new Set(tradableAbilities as string[]);

interface Props {
  group: GroupResult;
  weeklyMap: Record<number, string>;
}

export default function BossMap({ group, weeklyMap }: Props) {
  const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
  const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

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
    <div className={styles.row}>{floors.map((f) => renderBossCard(f))}</div>
  );

  return (
    <>
      <h3>本周地图</h3>
      {renderRow(row1)}
      {renderRow(row2)}
    </>
  );
}
