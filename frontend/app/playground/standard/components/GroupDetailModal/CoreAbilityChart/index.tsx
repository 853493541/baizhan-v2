"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

interface WeeklyAbility {
  name: string;
  level: number;
}

interface Props {
  group: GroupResult;
  weeklyAbilities: WeeklyAbility[];
}

// ✅ Core 8 abilities (fixed)
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

export default function CoreAbilityChart({
  group,
  weeklyAbilities,
}: Props) {
  // ✅ expand weeklyAbilities: if a Lv10 drop exists, also consider Lv9
  const expandedWeekly = [
    ...weeklyAbilities,
    ...weeklyAbilities
      .filter((w) => w.level === 10)
      .map((w) => ({ ...w, level: 9 })),
  ];

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.abilityTable}>
        <thead>
          <tr>
            <th>技能</th>
            {group.characters.map((c) => {
              let roleClass = "";
              if (c.role === "Tank") roleClass = styles.tank;
              if (c.role === "DPS") roleClass = styles.dps;
              if (c.role === "Healer") roleClass = styles.healer;

              return (
                <th key={c._id} className={roleClass}>
                  {c.name}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {CORE_ABILITIES.map((abilityName, idx) => {
            // all drop levels available for this ability (after expansion)
            const waLevels = expandedWeekly
              .filter((w) => w.name === abilityName)
              .map((w) => w.level);

            // pick the highest drop level
            const dropLevel =
              waLevels.length > 0 ? Math.max(...waLevels) : null;

            return (
              <tr key={idx}>
                <td className={styles.abilityNameCell}>
                  <img
                    src={`/icons/${abilityName}.png`}
                    alt={abilityName}
                    className={styles.abilityLogo}
                    onError={(e) =>
                      (e.currentTarget.style.display = "none")
                    }
                  />
                  {abilityName}
                </td>
                {group.characters.map((c) => {
                  const lvl = c.abilities?.[abilityName] ?? 0;

                  let cellClass = "";
                  if (dropLevel !== null) {
                    if (lvl > 0 && lvl < dropLevel) {
                      cellClass = styles.canUse; // highlight green
                    } else if (lvl >= dropLevel) {
                      // logic still here, but no highlight applied
                      cellClass = "";
                    }
                  }

                  return (
                    <td key={c._id} className={cellClass}>
                      {lvl > 0 ? lvl : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
