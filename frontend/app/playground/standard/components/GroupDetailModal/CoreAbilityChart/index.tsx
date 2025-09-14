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
  conflictLevel: number;
  weeklyAbilities: WeeklyAbility[];
}

export default function CoreAbilityChart({
  group,
  checkedAbilities,
  conflictLevel,
  weeklyAbilities,
}: Props) {
  // ✅ only include abilities available in weekly map
  const filteredAbilities = checkedAbilities.filter((a) =>
    weeklyAbilities.some((wa) => wa.name === a.name)
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
              const wa = weeklyAbilities.find((w) => w.name === a.name);
              const requiredLevel = wa?.level ?? conflictLevel;

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
                    const belowRequirement = lvl > 0 && lvl < requiredLevel;
                    const aboveRequirement = lvl >= requiredLevel;

                    return (
                      <td
                        key={c._id}
                        className={
                          belowRequirement
                            ? styles.below
                            : aboveRequirement
                            ? styles.above
                            : ""
                        }
                      >
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
