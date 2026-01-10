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

type ViewLevel = 9 | 10;
const REQUIRED = 2;

/* ===============================
   Ability Groups
================================ */
const PRIMARY_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "飞云回转刀",
  "厄毒爆发",
  "短歌万劫",
];

const SECONDARY_ABILITIES = [
  "乾坤一掷",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
];

/* ===============================
   Hover State
================================ */
interface HoverData {
  x: number;
  y: number;
  text: Character[];
  abilityName?: string;
  level?: number;
  icon?: string;
  visible: boolean;
}

/* ===============================
   Ability Rows (NO HEADER)
================================ */
function AbilityRows({
  abilities,
  checkedAbilities,
  groups,
  viewLevel,
  setHover,
}: {
  abilities: string[];
  checkedAbilities: AbilityCheck[];
  groups: GroupLike[];
  viewLevel: ViewLevel;
  setHover: React.Dispatch<React.SetStateAction<HoverData>>;
}) {
  const rows = useMemo(() => {
    return checkedAbilities
      .filter(
        (a) =>
          a.available &&
          a.level === viewLevel &&
          abilities.includes(a.name)
      )
      .map((a) => {
        const row: Record<string, any> = { name: a.name, level: a.level };

        for (let i = 0; i < groups.length; i++) {
          let count = 0;
          const missingChars: Character[] = [];

          for (const c of groups[i].characters) {
            const lvl = c.abilities?.[a.name] ?? 0;
            if (lvl >= a.level) count++;
            else missingChars.push(c);
          }

          row[`group${i + 1}`] = { count, missingChars };
        }

        return row;
      });
  }, [checkedAbilities, groups, viewLevel, abilities]);

  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => (
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
            const isOver = count > REQUIRED;

            return (
              <td
                key={i}
                className={`${styles.cell} ${
                  isOver ? styles.over : styles.ok
                }`}
                onMouseEnter={(e) => {
                  if (isOver) return;
                  setHover({
                    x: e.clientX + 12,
                    y: e.clientY + 16,
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
                {isOver && <span className={styles.cross}>✖</span>}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/* ===============================
   Main Component
================================ */
export default function AbilityCheckingSection({
  checkedAbilities,
  groups,
}: Props) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>(10);
  const [hover, setHover] = useState<HoverData>({
    x: 0,
    y: 0,
    text: [],
    visible: false,
  });

  const hasSecondary = useMemo(() => {
    return checkedAbilities.some(
      (a) =>
        a.available &&
        a.level === viewLevel &&
        SECONDARY_ABILITIES.includes(a.name)
    );
  }, [checkedAbilities, viewLevel]);

  return (
    <div
      className={styles.previewBox}
      onMouseMove={(e) => {
        if (!hover.visible) return;
        setHover((h) => ({
          ...h,
          x: e.clientX + 12,
          y: e.clientY + 16,
        }));
      }}
    >
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${
              viewLevel === 10 ? styles.active : ""
            }`}
            onClick={() => setViewLevel(10)}
          >
            10重
          </button>
          <button
            className={`${styles.toggleBtn} ${
              viewLevel === 9 ? styles.active : ""
            }`}
            onClick={() => setViewLevel(9)}
          >
            9重
          </button>
        </div>
      </div>

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
            {/* Primary */}
            <AbilityRows
              abilities={PRIMARY_ABILITIES}
              checkedAbilities={checkedAbilities}
              groups={groups}
              viewLevel={viewLevel}
              setHover={setHover}
            />

            {/* Small spacer */}
            {hasSecondary && (
              <tr className={styles.sectionSpacer}>
                <td colSpan={groups.length + 1} />
              </tr>
            )}

            {/* Secondary (no header) */}
            <AbilityRows
              abilities={SECONDARY_ABILITIES}
              checkedAbilities={checkedAbilities}
              groups={groups}
              viewLevel={viewLevel}
              setHover={setHover}
            />
          </tbody>
        </table>
      </div>

      {/* Hover */}
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
            />
            <span className={styles.hoverTitle}>
              {hover.level}重 {hover.abilityName}
            </span>
          </div>

          <div className={styles.hoverContent}>
            <strong>缺少：</strong>
            {hover.text.map((m, idx) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
