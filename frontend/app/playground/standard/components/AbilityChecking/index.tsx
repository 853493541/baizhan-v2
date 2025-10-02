"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import { AbilityCheck, Character } from "@/utils/solver";

interface GroupLike {
  characters: Character[];
}

interface Props {
  checkedAbilities: AbilityCheck[];
  groups: GroupLike[];
}

const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
];

type ViewLevel = 9 | 10;

export default function AbilityCheckingSection({ checkedAbilities, groups }: Props) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>(9);
  const [hiddenByLevel, setHiddenByLevel] = useState<
    Record<ViewLevel, Record<string, boolean>>
  >({
    9: {},
    10: {},
  });

  // 🔎 Candidates (filter abilities that match the selected level + core list)
  const candidates = useMemo(() => {
    return checkedAbilities.filter(
      (a) => a.available && a.level === viewLevel && CORE_ABILITIES.includes(a.name)
    );
  }, [checkedAbilities, viewLevel]);

  const hiddenForLevel = hiddenByLevel[viewLevel] || {};
  const isHidden = (key: string) => !!hiddenForLevel[key];

  const toggleAbilityVisibility = (key: string) => {
    setHiddenByLevel((prev) => ({
      ...prev,
      [viewLevel]: { ...prev[viewLevel], [key]: !prev[viewLevel]?.[key] },
    }));
  };

  // ✅ Counts per group
  const qaResults = useMemo(() => {
    return groups.map((g, idx) => {
      const abilityCounts: Record<string, number> = {};
      for (const a of candidates) {
        const key = `${a.name}-${a.level}`;
        let count = 0;
        for (const c of g.characters) {
          const charLvl = c.abilities?.[a.name] ?? 0;

          // ✅ Strict logic
          if (a.level === 9) {
            if (charLvl >= 9) count++;
          } else if (a.level === 10) {
            if (charLvl === 10) count++;
          }
        }
        abilityCounts[key] = count;
      }
      return { index: idx + 1, abilityCounts };
    });
  }, [groups, candidates]);

  return (
    <div className={styles.previewBox}>
      {/* Header row with title, level toggle, ability toggles */}
      <div className={styles.headerRow}>
        <h4 className={styles.header}>核心技能检查</h4>

        <div className={styles.controls}>
          <div className={styles.toggle}>
            <button
              className={`${styles.toggleBtn} ${
                viewLevel === 9 ? styles.active : ""
              }`}
              onClick={() => setViewLevel(9)}
            >
              9重
            </button>
            <button
              className={`${styles.toggleBtn} ${
                viewLevel === 10 ? styles.active : ""
              }`}
              onClick={() => setViewLevel(10)}
            >
              10重
            </button>
          </div>

          <div className={styles.abilityToggleRow}>
            {candidates.map((a) => {
              const key = `${a.name}-${a.level}`;
              const off = isHidden(key);
              return (
                <button
                  key={key}
                  className={`${styles.abilityIconBtn} ${
                    off ? styles.iconOff : styles.iconOn
                  }`}
                  title={`${a.name} ${a.level}重`}
                  onClick={() => toggleAbilityVisibility(key)}
                >
                  <Image
                    src={`/icons/${a.name}.png`}
                    alt={a.name}
                    width={22}
                    height={22}
                    className={styles.icon}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Groups grid */}
      <div className={styles.groupsGrid}>
        {qaResults.map((res) => (
          <div key={res.index} className={styles.groupCard}>
            <h5 className={styles.groupTitle}>组 {res.index}</h5>
            <div className={styles.abilityList}>
              {Object.entries(res.abilityCounts).map(([key, count]) => {
                if (isHidden(key)) return null;
                const [name] = key.split("-");
                const overLimit = count > 2;

                // ✅ Level 9: only show violating ones
                if (viewLevel === 9 && !overLimit) return null;

                return (
                  <div
                    key={key}
                    className={`${styles.abilityItem} ${
                      overLimit ? styles.over : styles.ok
                    }`}
                  >
                    <Image
                      src={`/icons/${name}.png`}
                      alt={name}
                      width={20}
                      height={20}
                      className={styles.icon}
                    />
                    <span>{count}/2</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
