"use client";
import React from "react";
import styles from "./styles.module.css";
import { getAbilityIcon } from "../drophelpers";

export default function AbilityList({
  options,
  tradableList = [],        // 🟣 紫书 list
  allHave9Options,
  allHave10Options,
  chosenDrop,
  setChosenDrop,
  floor,
  markStartedIfNeeded,
  onSave,
  onClose,
}: any) {
  /* === Gender-based ability pair mapping === */
  // Only merge 剑心通明 ↔ 巨猿劈山 for normal 九重/十重
  const NORMAL_MERGE_PAIRS: Record<string, string> = {
    "剑心通明": "巨猿劈山",
  };

  // Full pair map (used for 紫书 + 非需求)
  const MERGE_PAIRS: Record<string, string> = {
    "剑心通明": "巨猿劈山",
    "帝骖龙翔": "顽抗",
  };

  const ALL_PAIR_MEMBERS = new Set(
    Object.entries(MERGE_PAIRS).flatMap(([a, b]) => [a, b])
  );

  const nineOptions = options.filter((opt: any) => opt.level === 9);
  const tenOptions = options.filter((opt: any) => opt.level === 10);

  const visibleNine = nineOptions.filter(
    (opt: any) => !allHave9Options.some((a: any) => a.ability === opt.ability)
  );
  const visibleTen = tenOptions.filter(
    (opt: any) => !allHave10Options.some((a: any) => a.ability === opt.ability)
  );

  const hasAllHave =
    allHave9Options.length > 0 || allHave10Options.length > 0;
  const hasTradables = tradableList.length > 0;

  /* === Merge helper === */
  const mergePairs = (list: string[], useFull = false) => {
    const PAIRS = useFull ? MERGE_PAIRS : NORMAL_MERGE_PAIRS;
    const result: { primary: string; displayName: string }[] = [];
    const seen = new Set<string>();

    for (const ability of list) {
      if (seen.has(ability)) continue;

      let primary: string | null = null;
      let secondary: string | null = null;

      if (PAIRS[ability]) {
        primary = ability;
        secondary = PAIRS[ability];
      } else {
        const foundPrimary = Object.entries(PAIRS).find(([p, s]) => s === ability);
        if (foundPrimary) {
          primary = foundPrimary[0];
          secondary = foundPrimary[1];
        }
      }

      if (primary && secondary) {
        const aShort = primary.slice(0, 2);
        const bShort = secondary.slice(0, 2);
        result.push({
          primary,
          displayName: `${aShort}/${bShort}`,
        });
        seen.add(primary);
        seen.add(secondary);
      } else {
        result.push({ primary: ability, displayName: ability });
        seen.add(ability);
      }
    }
    return result;
  };

  /* === Apply merge === */
  const mergedNine = mergePairs(visibleNine.map((a: any) => a.ability));
  const mergedTen = mergePairs(visibleTen.map((a: any) => a.ability));

  const mergedTradables = mergePairs(tradableList, true);
  const mergedAllHave9 = mergePairs(allHave9Options.map((a: any) => a.ability), true);
  const mergedAllHave10 = mergePairs(allHave10Options.map((a: any) => a.ability), true);

  return (
    <div className={styles.leftColumn}>
      <div className={styles.dropList}>
        {/* === 九重 === */}
        {mergedNine.length > 0 && (
          <>
            <div className={styles.sectionDivider}>九重</div>
            {mergedNine.map((entry, i: number) => (
              <button
                key={`9-${i}`}
                className={`${styles.dropBtn} ${
                  chosenDrop?.ability === entry.primary && chosenDrop?.level === 9
                    ? styles.activeBtn
                    : ""
                }`}
                onClick={() =>
                  setChosenDrop({ ability: entry.primary, level: 9 })
                }
              >
                <img
                  src={getAbilityIcon(entry.primary)}
                  alt={entry.displayName}
                  className={styles.iconSmall}
                />
                <span className={styles.dropText}>九重 · {entry.displayName}</span>
              </button>
            ))}
          </>
        )}

        {/* === 十重 === */}
        {mergedTen.length > 0 && (
          <>
            <div className={styles.sectionDivider}>十重</div>
            {mergedTen.map((entry, i: number) => (
              <button
                key={`10-${i}`}
                className={`${styles.dropBtn} ${
                  chosenDrop?.ability === entry.primary && chosenDrop?.level === 10
                    ? styles.activeBtn
                    : ""
                }`}
                onClick={() =>
                  setChosenDrop({ ability: entry.primary, level: 10 })
                }
              >
                <img
                  src={getAbilityIcon(entry.primary)}
                  alt={entry.displayName}
                  className={styles.iconSmall}
                />
                <span className={styles.dropText}>十重 · {entry.displayName}</span>
              </button>
            ))}
          </>
        )}

        {/* === 紫书掉落 === */}
        {hasTradables && (
          <>
            <div className={styles.sectionDivider}>紫书</div>
            {mergedTradables.map((entry, i: number) => {
              const drops: { level: 9 | 10 }[] =
                floor >= 81 && floor <= 90
                  ? [{ level: 9 }]
                  : [{ level: 9 }, { level: 10 }];

              return drops.map(({ level }) => (
                <button
                  key={`purple-${i}-${level}`}
                  className={`${styles.dropBtn} ${styles.purpleBookBtn}`}
                  onClick={() => {
                    markStartedIfNeeded();
                    onSave(floor, { ability: entry.primary, level });
                    onClose();
                  }}
                >
                  <img
                    src={getAbilityIcon(entry.primary)}
                    alt={entry.displayName}
                    className={styles.iconSmall}
                  />
                  <span className={styles.dropText}>
                    {level === 9 ? "九重" : "十重"} · {entry.displayName}
                  </span>
                </button>
              ));
            })}
          </>
        )}

        {/* === 非需求掉落 (全有 + 无掉落) === */}
        {(hasAllHave || true) && (
          <>
            <div className={styles.sectionDivider}>浪费</div>

            {/* 全有 (九重) */}
            {mergedAllHave9.map((entry, i: number) => (
              <button
                key={`allhave9-${i}`}
                className={`${styles.dropBtn} ${styles.allHaveBtn}`}
                onClick={() => {
                  markStartedIfNeeded();
                  onSave(floor, { ability: entry.primary, level: 9 });
                  onClose();
                }}
              >
                <img
                  src={getAbilityIcon(entry.primary)}
                  alt={entry.displayName}
                  className={styles.iconSmall}
                />
                <span className={styles.dropText}>
                  九重 · {entry.displayName} (全有)
                </span>
              </button>
            ))}

            {/* 全有 (十重) */}
            {mergedAllHave10.map((entry, i: number) => (
              <button
                key={`allhave10-${i}`}
                className={`${styles.dropBtn} ${styles.allHaveBtn}`}
                onClick={() => {
                  markStartedIfNeeded();
                  onSave(floor, { ability: entry.primary, level: 10 });
                  onClose();
                }}
              >
                <img
                  src={getAbilityIcon(entry.primary)}
                  alt={entry.displayName}
                  className={styles.iconSmall}
                />
                <span className={styles.dropText}>
                  十重 · {entry.displayName} (全有)
                </span>
              </button>
            ))}

            {/* 无掉落 */}
            <button
              className={`${styles.dropBtn} ${styles.allHaveBtn}`}
              onClick={() => {
                markStartedIfNeeded();
                onSave(floor, { noDrop: true });
                onClose();
              }}
            >
              <img
                src="/icons/no_drop.svg"
                alt="无掉落"
                className={styles.iconSmall}
              />
              <span className={styles.dropText}>无掉落</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
