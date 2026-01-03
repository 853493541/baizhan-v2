"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import type { Character } from "@/utils/solver";

interface GroupLike {
  characters: Character[];
}

interface Props {
  groups: GroupLike[];
}

const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "兔死狐悲",
];

interface HoverData {
  x: number;
  y: number;
  text: Character[];
  missing: Character[];
  abilityName?: string;
  icon?: string;
  visible: boolean;
}

export default function AbilityCoverage({ groups }: Props) {
  const [hover, setHover] = useState<HoverData>({
    x: 0,
    y: 0,
    text: [],
    missing: [],
    visible: false,
  });

  const LEVEL = 10; // Always check level 10

  // ✅ Build matrix directly from core abilities
  const coverageMatrix = useMemo(() => {
    return CORE_ABILITIES.map((name) => {
      const row: Record<string, any> = { name };
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        let count = 0;
        const haveChars: Character[] = [];
        const missingChars: Character[] = [];

        for (const c of g.characters) {
          const lvl = c.abilities?.[name] ?? 0;
          if (lvl >= LEVEL) {
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
  }, [groups]);

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
      {/* Header with static "10重" toggle */}
      <div className={styles.headerRow}>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${styles.active}`}
            disabled
            title="仅显示10重技能"
          >
            10重
          </button>
        </div>
      </div>

      {/* Table */}
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
            {coverageMatrix.map((row) => (
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
                  const { count, haveChars, missingChars } =
                    row[`group${i + 1}`];

                  let cellClass = styles.ok;
                  let content: React.ReactNode = null;

                  // ❌ Only true error: none have the ability
                  if (count === 0) {
                    cellClass = styles.over;
                    content = <span className={styles.cross}>✖</span>;
                  }
                  // 🟢 count === 3 is now treated as OK (no icon)

                  return (
                    <td
                      key={i}
                      className={`${styles.cell} ${cellClass}`}
                      onMouseEnter={(e) => {
                        setHover({
                          x: e.clientX + 12,
                          y: e.clientY + 16,
                          text: haveChars,
                          missing: missingChars,
                          abilityName: row.name,
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

      {/* Hover Box */}
      {hover.visible && (
        <div
          className={styles.hoverBox}
          style={{
            position: "fixed",
            left: hover.x,
            top: hover.y,
          }}
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
              10重 {hover.abilityName}
            </span>
          </div>

          <div className={styles.hoverContent}>
            <strong>拥有：</strong>
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
              <span>（无）</span>
            )}

            <br />
            <strong>缺少：</strong>
            {hover.missing.length > 0 ? (
              hover.missing.map((m, idx) => (
                <div key={idx} className={styles.missingBadge}>
                  {m.name}
                </div>
              ))
            ) : (
              <span>（全有）</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
