"use client";

import React, { useEffect } from "react";
import styles from "./styles.module.css";
import { canUseAbility } from "@/utils/genderCheck";

interface BossCardProps {
  floor: number;
  boss?: string;
  group: any;
  bossData: Record<string, string[]>;
  highlightAbilities: string[];
  tradableSet: Set<string>;
  kill?: any;
  onSelect: (floor: number, boss: string, dropList: string[], dropLevel: 9 | 10) => void;
}

export default function BossCard({
  floor,
  boss,
  group,
  bossData,
  highlightAbilities,
  tradableSet,
  kill,
  onSelect,
}: BossCardProps) {
  // 🔍 Debug logging
  useEffect(() => {
    console.log(`[BossCard] floor=${floor}`, { kill, selection: kill?.selection });
  }, [floor, kill]);

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

  // ✅ Needs calculation
  let needs = dropList
    .filter((ability) => !tradableSet.has(ability))
    .map((ability) => {
      const needCount = group.characters.filter((c: any) => {
        const lvl = c.abilities?.[ability] ?? 0;
        const usable = canUseAbility(c, ability);
        return usable && lvl < dropLevel;
      }).length;

      if (needCount > 0) {
        const isHighlight = highlightAbilities.includes(ability);
        return { ability, needCount, isHighlight };
      }
      return null;
    })
    .filter(Boolean) as { ability: string; needCount: number; isHighlight: boolean }[];

  needs.sort((a, b) => {
    if (a.isHighlight && !b.isHighlight) return -1;
    if (!a.isHighlight && b.isHighlight) return 1;
    return 0;
  });

  const content =
    needs.length > 0 ? (
      <ul className={styles.needList}>
        {needs.map((n) => (
          <li key={n.ability} className={n.isHighlight ? styles.coreHighlight : ""}>
            {n.ability}（{n.needCount}）
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.noNeed}>无需求</p>
    );

  // ✅ Resolve assigned character name
  let assignedName = "";
  if (kill?.selection?.characterId) {
    const char = group.characters.find((c: any) => c._id === kill.selection.characterId);
    assignedName = char ? char.name : kill.selection.characterId;
  }

  // ✅ If there is a kill record, render drop/noDrop
  const dropDisplay = kill?.selection ? (
    kill.selection.noDrop ? (
      <div className={styles.dropResult}>无掉落</div>
    ) : (
      <div className={styles.dropResult}>
        掉落：{kill.selection.ability}（{kill.selection.level}阶）
        {assignedName && <span className={styles.assignedTo}> → {assignedName}</span>}
      </div>
    )
  ) : null;

  return (
    <div
      key={floor}
      className={`${styles.card} ${styles.cardInteractive}`}
      onClick={() => onSelect(floor, boss, dropList, dropLevel as 9 | 10)}
    >
      <div className={styles.floorLabel}>
        {floor} {boss}
      </div>

      {dropDisplay || content}
    </div>
  );
}
