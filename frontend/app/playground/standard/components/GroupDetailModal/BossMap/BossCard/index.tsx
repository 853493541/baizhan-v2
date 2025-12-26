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
  activeMembers?: number[];
  onSelect: (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: 9 | 10
  ) => void;

  // ⭐ NEW: trigger boss change (parent handles modal)
  onChangeBoss?: (floor: 90 | 100) => void;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function BossCard({
  floor,
  boss,
  group,
  bossData,
  highlightAbilities,
  tradableSet,
  kill,
  activeMembers = [0, 1, 2],
  onSelect,
  onChangeBoss,
}: BossCardProps) {
  useEffect(() => {
    // debug placeholder
  }, [floor, kill]);

  if (!boss) {
    return (
      <div key={floor} className={styles.card}>
        <div className={styles.floorLabel}>{floor}</div>
        <div className={styles.noNeed}>未选择</div>
      </div>
    );
  }

  const fullDropList: string[] = bossData[boss] || [];
  const tradableList = fullDropList.filter((a) => tradableSet.has(a));
  const dropList = fullDropList.filter((a) => !tradableSet.has(a));
  const dropLevel = floor >= 81 && floor <= 90 ? 9 : 10;

  const includedChars = group.characters.filter((_: any, i: number) =>
    activeMembers.includes(i)
  );

  const healerAbilities = ["万花金创药", "特制金创药", "毓秀灵药", "霞月长针"];

  let needs = dropList
    .map((ability) => {
      const needers = includedChars.filter((c: any) => {
        const lvl = c.abilities?.[ability] ?? 0;
        const usable = canUseAbility(c, ability);
        return usable && lvl < dropLevel;
      });
      const needCount = needers.length;
      if (needCount > 0) {
        const isHighlightBase = highlightAbilities.includes(ability);
        let isHighlight = isHighlightBase;

        if (isHighlightBase && healerAbilities.includes(ability)) {
          isHighlight = needers.some(
            (c: any) => c.role?.toLowerCase() === "healer"
          );
        }

        return { ability, needCount, isHighlight };
      }
      return null;
    })
    .filter(Boolean) as {
    ability: string;
    needCount: number;
    isHighlight: boolean;
  }[];

  needs.sort((a, b) => {
    if (a.isHighlight && !b.isHighlight) return -1;
    if (!a.isHighlight && b.isHighlight) return 1;
    return 0;
  });

  const content =
    needs.length > 0 ? (
      <ul className={styles.needList}>
        {needs.map((n) => (
          <li
            key={n.ability}
            className={n.isHighlight ? styles.coreHighlight : ""}
          >
            {n.ability} ({n.needCount})
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.noNeed}>无需求</p>
    );

  let assignedName = "";
  if (kill?.selection?.characterId) {
    const char = group.characters.find(
      (c: any) => c._id === kill.selection.characterId
    );
    assignedName = char ? char.name : kill.selection.characterId;
  }

  let dropDisplay = null;
  if (kill?.selection) {
    const sel = kill.selection;

    if (sel.noDrop || (!sel.ability && !sel.purpleBook)) {
      dropDisplay = (
        <div className={`${styles.dropResult} ${styles.noDrop}`}>
          <img
            src="/icons/no_drop.svg"
            alt="无掉落"
            className={`${styles.iconLarge} ${styles.iconNoDrop}`}
          />
          <div>无掉落</div>
        </div>
      );
    } else if (sel.purpleBook) {
      dropDisplay = (
        <div
          className={`${styles.dropResult} ${styles.wasted} ${styles.purpleBookResult}`}
        >
          <img
            src={getAbilityIcon(sel.ability)}
            alt={sel.ability}
            className={`${styles.iconLarge} ${styles.iconWasted}`}
          />
          <div>{sel.ability}</div>
          <div>{sel.level}重（紫书）</div>
        </div>
      );
    } else if (sel.ability && !sel.characterId) {
      dropDisplay = (
        <div
          className={`${styles.dropResult} ${styles.wasted} ${styles.stackCenter}`}
        >
          <img
            src={getAbilityIcon(sel.ability)}
            alt={sel.ability}
            className={`${styles.iconLarge} ${styles.iconWasted}`}
          />
          <div>{sel.ability}</div>
          <div>{sel.level}重</div>
          <div>(无)</div>
        </div>
      );
    } else {
      dropDisplay = (
        <div className={`${styles.dropResult} ${styles.normal}`}>
          <img
            src={getAbilityIcon(sel.ability)}
            alt={sel.ability}
            className={styles.iconLarge}
          />
          <div>{sel.ability}</div>
          <div>{sel.level}重</div>
          {assignedName && <div>{assignedName}</div>}
        </div>
      );
    }
  }

  return (
    <div
      key={floor}
      className={`${styles.card} ${styles.cardInteractive} ${
        kill?.selection?.ability && kill?.selection?.characterId
          ? styles.cardNormal
          : (kill?.selection?.noDrop ||
              kill?.selection?.purpleBook ||
              (kill?.selection?.ability && !kill?.selection?.characterId))
          ? styles.cardHealer
          : ""
      }`}
      onClick={() =>
        onSelect(floor, boss, dropList, tradableList, dropLevel as 9 | 10)
      }
    >
      {/* ⭐ 换 按钮（只给 90 / 100） */}
      {(floor === 90 || floor === 100) && onChangeBoss && (
        <button
          className={styles.changeBtn}
          title="更换首领"
          onClick={(e) => {
            e.stopPropagation();
            onChangeBoss(floor);
          }}
        >
          换
        </button>
      )}

      <div className={styles.header}>
        {floor} {boss}
      </div>

      {dropDisplay || content}
    </div>
  );
}
