"use client";

import React from "react";
import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

interface WeeklyAbility {
  name: string;
  level: number;
}

interface Props {
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  weeklyAbilities: WeeklyAbility[];
}

export default function CoreAbilityChart({
  group,
  checkedAbilities,
  weeklyAbilities,
}: Props) {
  // ✅ expand weeklyAbilities: if a Lv10 drop exists, also consider Lv9
  const expandedWeekly = [
    ...weeklyAbilities,
    ...weeklyAbilities
      .filter((w) => w.level === 10)
      .map((w) => ({ ...w, level: 9 })),
  ];

  // ✅ only include checked abilities that are in expanded weekly list
  const filteredAbilities = checkedAbilities.filter((a) =>
    expandedWeekly.some((wa) => wa.name === a.name)
  );

  return (
    <>
      <h3>核心技能详情</h3>
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
            {filteredAbilities.map((a, idx) => {
              // all drop levels available for this ability (after expansion)
              const waLevels = expandedWeekly
                .filter((w) => w.name === a.name)
                .map((w) => w.level);

              // pick the highest drop level
              const dropLevel = waLevels.length > 0 ? Math.max(...waLevels) : null;

              return (
                <tr key={idx}>
                  <td className={styles.abilityNameCell}>
                    <img
                      src={`/icons/${a.name}.png`}
                      alt={a.name}
                      className={styles.abilityLogo}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    {a.name}
                  </td>
                  {group.characters.map((c) => {
                    const lvl = c.abilities?.[a.name] ?? 0;

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
    </>
  );
}
