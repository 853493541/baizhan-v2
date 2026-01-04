"use client";

import React, { useEffect, useMemo } from "react";
import styles from "./styles.module.css";
import { calcBossNeeds } from "./calcBossNeeds";

/* ✅ SINGLE SOURCE OF TRUTH */
import tradableAbilities from "@/app/data/tradable_abilities.json";

interface BossCardProps {
  floor: number;
  boss?: string;
  group: any;
  bossData: Record<string, string[]>;
  highlightAbilities: string[];
  kill?: any;
  activeMembers?: number[];
  onSelect: (
    floor: number,
    boss: string,
    dropList: string[],
    tradableList: string[],
    dropLevel: 9 | 10
  ) => void;
  onChangeBoss?: (floor: 90 | 100) => void;

  // ⭐ mutation toggle (异)
  onToggleMutation?: (floor: number) => void;

  // ➕ secondary drop
  onAddSecondaryDrop?: (floor: number) => void;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

/* 🧬 Mutated Boss（异类） */
const mutatedBosses = new Set([
  "肖红",
  "青年程沐华",
  "困境韦柔丝",
]);

/* 🧬 Gray mutation badge bosses (still clickable) */
const grayMutationBosses = new Set([
  "程沐华",
  "韦柔丝",
  "肖童",
]);

/* 🔴 Bosses that should be RED ONLY when there is NO kill record yet */
const redHeaderBosses = new Set([
  "青年程沐华",
  "困境韦柔丝",
  "肖红",
]);

export default function BossCard({
  floor,
  boss,
  group,
  bossData,
  highlightAbilities,
  kill,
  activeMembers = [0, 1, 2],
  onSelect,
  onChangeBoss,
  onToggleMutation,
  onAddSecondaryDrop,
}: BossCardProps) {
  useEffect(() => {}, [floor, kill]);

  /* ===============================
     Tradable set
  ================================= */
  const tradableSet = useMemo(() => new Set<string>(tradableAbilities), []);

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

  const dropLevel: 9 | 10 = floor >= 81 && floor <= 90 ? 9 : 10;

  /* ===============================
     Needs
  ================================= */
  const needs = calcBossNeeds({
    boss,
    bossData,
    group,
    activeMembers,
    dropLevel,
    highlightAbilities,
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

  /* ===============================
     Drop + card state
  ================================= */
  let dropDisplay: React.ReactNode = null;
  let cardStateClass = "";
  let dropResultClass = "";

  if (kill?.selection) {
    const sel = kill.selection;

    if (sel.noDrop || (!sel.ability && !sel.characterId)) {
      cardStateClass = styles.cardHealer;
      dropResultClass = styles.noDrop;

      dropDisplay = (
        <div className={`${styles.dropResult} ${dropResultClass}`}>
          <img
            src="/icons/no_drop.svg"
            alt="无掉落"
            className={`${styles.iconLarge} ${styles.iconNoDrop}`}
          />
          <div>无掉落</div>
        </div>
      );
    } else if (sel.ability && tradableSet.has(sel.ability)) {
      cardStateClass = styles.cardPurple;
      dropResultClass = styles.purple;

      dropDisplay = (
        <div className={`${styles.dropResult} ${dropResultClass}`}>
          <img
            src={getAbilityIcon(sel.ability)}
            alt={sel.ability}
            className={styles.iconLarge}
          />
          <div>{sel.ability}</div>
          <div>{sel.level}重</div>
          <div>(无)</div>
        </div>
      );
    } else if (sel.ability && !sel.characterId) {
      cardStateClass = styles.cardHealer;
      dropResultClass = styles.wasted;

      dropDisplay = (
        <div className={`${styles.dropResult} ${dropResultClass}`}>
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
    } else if (sel.ability && sel.characterId) {
      cardStateClass = styles.cardNormal;
      dropResultClass = styles.normal;

      const char = group.characters.find(
        (c: any) => c._id === sel.characterId
      );
      const assignedName = char ? char.name : sel.characterId;

      dropDisplay = (
        <div className={`${styles.dropResult} ${dropResultClass}`}>
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

  /* ===============================
     Derived UI flags
  ================================= */
  const isMutatedBoss = mutatedBosses.has(boss);
  const isGrayMutation = grayMutationBosses.has(boss);

  const hasKillRecord = !!kill;
  const isRedHeader = redHeaderBosses.has(boss) && !hasKillRecord;

  const hideFloorInHeader = floor === 100 && boss === "青年谢云流";

  return (
    <div
      key={floor}
      className={`${styles.card} ${styles.cardInteractive} ${cardStateClass}`}
      onClick={() => onSelect(floor, boss, dropList, tradableList, dropLevel)}
    >
      {/* ⭐ Mutation badge */}
      {(isMutatedBoss || onToggleMutation) && (
        <button
          className={`${styles.mutatedBossBadge} ${
            isGrayMutation ? styles.mutatedBossBadgeGray : ""
          }`}
          title="异"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMutation?.(floor);
          }}
        >
          异
        </button>
      )}

      {/* 🔁 Swap badge */}
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

      {/* ➕ Secondary drop button (bottom-left) */}
      {onAddSecondaryDrop && (
        <button
          className={styles.addSecondaryBtn}
          title="添加第二掉落"
          onClick={(e) => {
            e.stopPropagation();
            onAddSecondaryDrop(floor);
          }}
        >
          +
        </button>
      )}

      <div
        className={`${styles.header} ${
          isRedHeader ? styles.headerRed : ""
        }`}
      >
        {hideFloorInHeader ? boss : `${floor} ${boss}`}
      </div>

      {dropDisplay || content}
    </div>
  );
}
