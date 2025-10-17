"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import {
  toAccountCapabilities,
  generateAccountSkeletons,
} from "./generateAccountSkeletons";
import { fillSkeletonsWithCharacters } from "./fillSkeletonsWithCharacters";
import { ComputeNeeds } from "./ComputeNeeds";
import { runReversedSolver } from "./ReversedSolver"; // solver logic file

interface Character {
  _id: string;
  name: string;
  account: string;
  role: "DPS" | "Healer" | "Tank";
  abilities?: Record<string, number>;
  needs?: { name: string; level: number }[];
}

interface FilledSkeleton {
  index: number;
  groups: {
    index: number;
    members: Character[];
  }[];
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
  "乾坤一掷",
  "飞云回转刀",
  "厄毒爆发",
  "短歌万劫",
];

function calculateTolerance(characters: Character[], groupCount: number) {
  const toleranceMap: Record<string, number> = {};

  for (const char of characters) {
    if (!char.needs) continue;
    for (const { name, level } of char.needs) {
      const key = `${name}${level}`;
      toleranceMap[key] = (toleranceMap[key] || 0) + 1;
    }
  }

  const GROUP_COUNT = groupCount;

  return Object.entries(toleranceMap)
    .map(([key, count]) => {
      const tolerance = Math.max(0, GROUP_COUNT - count);
      const neededGroups = GROUP_COUNT - tolerance;
      return { ability: key, neededGroups };
    })
    .sort((a, b) => b.neededGroups - a.neededGroups);
}

export default function ReversedSolver({
  characters,
  checkedAbilities,
}: {
  characters: Character[];
  checkedAbilities: { name: string; level: number; available: boolean }[];
}) {
  const [filledSkeletons, setFilledSkeletons] = useState<FilledSkeleton[]>([]);
  const [tolerance, setTolerance] = useState<{ ability: string; neededGroups: number }[]>([]);

  useEffect(() => {
    if (!characters?.length || !checkedAbilities?.length) return;

    const charsWithNeeds = ComputeNeeds(characters, checkedAbilities);

    const weekCoreAbilities: string[] = [];
    for (const base of CORE_ABILITIES) {
      const foundLevels = checkedAbilities
        .filter((a) => a.name.startsWith(base))
        .map((a) => `${a.name}${a.level}`);
      weekCoreAbilities.push(...foundLevels);
    }
    console.log("[Reversed Solver] Weekly Core Abilities (auto-expanded):", weekCoreAbilities);

    const accountCaps = toAccountCapabilities(charsWithNeeds);
    const skeletonSets: FilledSkeleton[] = [];

    for (let i = 0; i < 10; i++) {
      const shuffled = [...accountCaps].sort(() => Math.random() - 0.5);
      const skeleton = generateAccountSkeletons(shuffled);
      const filled = fillSkeletonsWithCharacters(skeleton, charsWithNeeds);
      if (filled.length > 0) skeletonSets.push({ ...filled[0], index: i });
    }

    setFilledSkeletons(skeletonSets);
    console.log("🎯 [Reversed Solver] 10 filled skeleton sets:", skeletonSets);

    const groupCount = skeletonSets[0]?.groups.length || Math.ceil(characters.length / 3);
    const tol = calculateTolerance(charsWithNeeds, groupCount);
    setTolerance(tol);
    console.log(`[Reversed Solver] Using groupCount = ${groupCount}`);
    console.log("[Reversed Solver] Ability Summary:", tol);

    // 🧩 Run solver for each skeleton
    let bestScore = -Infinity;
    let bestIndex = -1;
    let coreFails = 0;
    const results: { index: number; score: number; status: string }[] = [];

    for (const sk of skeletonSets) {
      const cleanGroups = sk.groups.map((g) => ({
        index: g.index,
        members: g.members.map((m) => ({
          _id: m._id,
          name: m.name,
          account: m.account,
          needs: m.needs,
        })),
      }));

      const result = runReversedSolver({
        groups: cleanGroups,
        abilitySummary: tol,
        coreAbilities: weekCoreAbilities,
      });

      results.push({ index: sk.index, score: result.totalScore, status: result.status });

      if (result.status === "core_violation") coreFails++;
      if (result.totalScore > bestScore) {
        bestScore = result.totalScore;
        bestIndex = sk.index;
      }
    }

    // 🧾 Summary
    console.log("--------------------------------------------------");
    console.log(`🏁 [Reversed Solver] Completed ${skeletonSets.length} evaluations`);
    console.log(
      `[Reversed Solver] Core Violations: ${coreFails} / ${skeletonSets.length}`
    );
    console.log(`[Reversed Solver] Best Score: ${bestScore} (Skeleton #${bestIndex})`);
    console.log(
      `[Reversed Solver] All Results:`,
      results.map((r) => `[${r.index}] ${r.status} → ${r.score}`).join(", ")
    );
    console.log("--------------------------------------------------");
  }, [characters, checkedAbilities]);

  // 🎨 UI Display (same)
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Healer":
        return { backgroundColor: "#ffe0f0", borderColor: "#ffa0c0" };
      case "Tank":
        return { backgroundColor: "#fff6c4", borderColor: "#ffd700" };
      case "DPS":
        return { backgroundColor: "#d8f3dc", borderColor: "#95d5b2" };
      default:
        return { backgroundColor: "#f0f0f0", borderColor: "#ccc" };
    }
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        🧩 Reversed Solver — 批量测试 10 骨架组
      </h3>

      {tolerance.length > 0 && (
        <div className={styles.toleranceBox}>
          <h4>📊 能力需求组数</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>能力 (含等级)</th>
                <th>需求组数</th>
              </tr>
            </thead>
            <tbody>
              {tolerance.map((t) => (
                <tr key={t.ability}>
                  <td>{t.ability}</td>
                  <td>{t.neededGroups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filledSkeletons.length === 0 ? (
        <p className={styles.empty}>暂无角色数据</p>
      ) : (
        filledSkeletons.map((sk) => (
          <div key={sk.index} className={styles.skeletonCard}>
            <div className={styles.skeletonHeader}>
              <strong>骨架组 #{sk.index + 1}</strong> — 共 {sk.groups.length} 组
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>组号</th>
                  <th>角色成员</th>
                </tr>
              </thead>
              <tbody>
                {sk.groups.map((g) => (
                  <tr key={g.index}>
                    <td>G{g.index + 1}</td>
                    <td>
                      {g.members.length === 0
                        ? "—"
                        : g.members.map((m, i) => (
                            <span
                              key={m._id}
                              className={styles.chip}
                              style={getRoleStyle(m.role)}
                            >
                              {m.name} {m.account}
                            </span>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
