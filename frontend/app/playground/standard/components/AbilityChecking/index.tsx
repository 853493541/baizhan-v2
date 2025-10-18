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
  "飞云回转刀",
  "厄毒爆发",
  "短歌万劫",
  "乾坤一掷"
];

type ViewLevel = 9 | 10;

interface HoverData {
  x: number;
  y: number;
  text: Character[];
  abilityName?: string;
  level?: number;
  icon?: string;
  visible: boolean;
}

export default function AbilityCheckingSection({ checkedAbilities, groups }: Props) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>(9);
  const [hover, setHover] = useState<HoverData>({
    x: 0,
    y: 0,
    text: [],
    visible: false,
  });

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
        const haveChars: Character[] = [];
        const missingChars: Character[] = [];

        for (const c of g.characters) {
          const charLvl = c.abilities?.[a.name] ?? 0;
          if (charLvl >= a.level) {
            count++;
            haveChars.push(c);
          } else {
            missingChars.push(c);
          }
        }

        row[`group${i + 1}`] = { count, haveChars, missingChars };
      }
      return row;
    });
  }, [candidates, groups, viewLevel]);

  return (
    <div
      className={styles.previewBox}
      onMouseMove={(e) => {
        if (hover.visible)
          setHover((h) => ({ ...h, x: e.clientX + 16, y: e.clientY + 16 }));
      }}
    >
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
                  const { count, missingChars } = row[`group${i + 1}`];
                  const over = count > 2;
                  let content: React.ReactNode;
                  let cellClass = styles.ok;

                  if (over) {
                    // 🔴 over limit (no hover)
                    content = `${count}/2`;
                    cellClass = styles.over;
                  } else if (count > 0) {
                    // 🟢 within limit
                    content = <span className={styles.check}>✅</span>;
                    cellClass = styles.ok;
                  } else {
                    // 🟡 missing
                    content = "0/2";
                    cellClass = styles.missing;
                  }

                  const showHover = !over; // ❌ no hover for red

                  return (
                    <td
                      key={i}
                      className={`${styles.cell} ${cellClass}`}
                      onMouseEnter={(e) => {
                        if (!showHover) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHover({
                          x: rect.left + rect.width / 2,
                          y: rect.top + window.scrollY - 10,
                          text: missingChars,
                          abilityName: row.name,
                          level: row.level,
                          icon: `/icons/${row.name}.png`,
                          visible: true,
                        });
                      }}
                      onMouseLeave={() =>
                        setHover((h) => ({ ...h, visible: false }))
                      }
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom Styled Hover Popup */}
      {hover.visible && (
        <div
          className={styles.hoverBox}
          style={{ left: hover.x, top: hover.y }}
        >
          <div className={styles.hoverHeader}>
            <Image
              src={hover.icon || ""}
              alt={hover.abilityName || ""}
              width={20}
              height={20}
              className={styles.hoverIcon}
            />
            <span className={styles.hoverTitle}>
              {hover.level}重 {hover.abilityName}
            </span>
          </div>
          <div className={styles.hoverContent}>
            <strong>缺失成员：</strong>
            {hover.text.length > 0 ? (
              hover.text.map((m, idx) => (
                <div
                  key={idx}
                  className={`${styles.roleBadge} ${
                    m.role === "Tank"
                      ? styles.tank
                      : m.role === "Healer"
                      ? styles.healer
                      : styles.dps
                  }`}
                >
                  {m.name}
                </div>
              ))
            ) : (
              <div>（无数据）</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
