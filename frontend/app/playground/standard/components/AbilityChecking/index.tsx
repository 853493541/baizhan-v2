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

  // ✅ Filter relevant abilities
  const candidates = useMemo(() => {
    return checkedAbilities.filter(
      (a) => a.available && a.level === viewLevel && CORE_ABILITIES.includes(a.name)
    );
  }, [checkedAbilities, viewLevel]);

  // ✅ Build table data
  const qaMatrix = useMemo(() => {
    return candidates.map((a) => {
      const row: Record<string, any> = { name: a.name, level: a.level };
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        let count = 0;
        for (const c of g.characters) {
          const charLvl = c.abilities?.[a.name] ?? 0;
          if (charLvl >= a.level) count++;
        }
        row[`group${i + 1}`] = count;
      }
      return row;
    });
  }, [candidates, groups, viewLevel]);

  return (
    <div className={styles.previewBox}>
      {/* Header */}
      <div className={styles.headerRow}>
        <h4 className={styles.header}>核心技能检查</h4>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${viewLevel === 9 ? styles.active : ""}`}
            onClick={() => setViewLevel(9)}
          >
            9重
          </button>
          <button
            className={`${styles.toggleBtn} ${viewLevel === 10 ? styles.active : ""}`}
            onClick={() => setViewLevel(10)}
          >
            10重
          </button>
        </div>
      </div>

      {/* Chart Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.chartTable}>
          <thead>
            <tr>
              <th>技能</th>
              {groups.map((_, i) => (
                <th key={i}>组 {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qaMatrix.map((row) => (
              <tr key={row.name}>
                <td className={styles.abilityCell}>
                  <Image
                    src={`/icons/${row.name}.png`}
                    alt={row.name}
                    width={22}
                    height={22}
                    className={styles.icon}
                  />
                  <span>{row.name}</span>
                </td>
                {groups.map((_, i) => {
                  const count = row[`group${i + 1}`];
                  const over = count > 2;
                  let content: React.ReactNode;
                  let cellClass = styles.ok;

                  if (over) {
                    // 🔴 over limit
                    content = `${count}/2`;
                    cellClass = styles.over;
                  } else if (count > 0) {
                    // ✅ within limit
                    content = <span className={styles.check}>✅</span>;
                    cellClass = styles.ok;
                  } else {
                    // 🟡 missing
                    content = "0/2";
                    cellClass = styles.missing;
                  }

                  return (
                    <td key={i} className={`${styles.cell} ${cellClass}`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
