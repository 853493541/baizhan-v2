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

const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "兔死狐悲",
  "阴阳术退散",
  "厄毒爆发",
  "短歌万劫",
];

/** === Utility: tolerance summary (需求组数) === */
function calculateTolerance(characters: Character[], groupCount: number) {
  const toleranceMap: Record<string, number> = {};
  for (const c of characters) {
    if (!c.needs) continue;
    for (const { name, level } of c.needs) {
      const key = `${name}${level}`;
      toleranceMap[key] = (toleranceMap[key] || 0) + 1;
    }
  }
  return Object.entries(toleranceMap)
    .map(([key, count]) => {
      const tolerance = Math.max(0, groupCount - count);
      const neededGroups = groupCount - tolerance;
      return { ability: key, neededGroups };
    })
    .sort((a, b) => b.neededGroups - a.neededGroups);
}

/** === Upload helper === */
async function uploadBestSet(bestSet: any, scheduleId: string) {
  if (!bestSet) return;
  if (!scheduleId) {
    console.warn("⚠️ No scheduleId provided for upload");
    return;
  }

  const payload = bestSet.groups.map((g: any) => ({
    index: g.index + 1,
    characters: g.members.map((m: any) => m._id),
  }));

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: payload }),
      }
    );
    if (res.ok) {
      console.log("💾 Reversed solver groups uploaded successfully");
    } else {
      console.error("❌ Failed to upload reversed solver groups:", await res.text());
    }
  } catch (err) {
    console.error("❌ Upload error:", err);
  }
}

/** === Core Engine for Quick Mode === */
async function runFixedSolver(
  characters: Character[],
  checkedAbilities: { name: string; level: number; available: boolean }[],
  scheduleId: string,
  setProgress: (p: number) => void,
  setSummary: (txt: string) => void
) {
  const start = performance.now();
  const charsWithNeeds = ComputeNeeds(characters, checkedAbilities);
  const accountCaps = toAccountCapabilities(charsWithNeeds);
  const groupCount = Math.ceil(characters.length / 3);
  const tol = calculateTolerance(charsWithNeeds, groupCount);

  const weekCoreAbilities: string[] = [];
  for (const base of CORE_ABILITIES) {
    const foundLevels = checkedAbilities
      .filter((a) => a.name.startsWith(base))
      .map((a) => `${a.name}${a.level}`);
    weekCoreAbilities.push(...foundLevels);
  }

  const TOTAL_RUNS = 20000;
  let validRuns = 0;
  let coreFails = 0;
  let sumScore = 0;
  let bestScore = Infinity;
  let bestSet: any = null;

  for (let totalRuns = 1; totalRuns <= TOTAL_RUNS; totalRuns++) {
    const shuffledCaps = [...accountCaps].sort(() => Math.random() - 0.5);
    const skeleton = generateAccountSkeletons(shuffledCaps)[0];
    if (!skeleton) continue;

    const filledArr = fillSkeletonsWithCharacters([skeleton], charsWithNeeds);
    if (filledArr.length === 0) continue;
    const filled = filledArr[0];

    const result = runReversedSolver({
      groups: filled.groups.map((g) => ({
        index: g.index,
        members: g.members.map((m) => ({
          _id: m._id,
          name: m.name,
          account: m.account,
          needs: m.needs,
        })),
      })),
      abilitySummary: tol,
      coreAbilities: weekCoreAbilities,
    });

    if (result.status === "core_violation") {
      coreFails++;
      continue;
    }

    validRuns++;
    sumScore += result.totalScore;

    if (result.totalScore > 0 && result.totalScore < bestScore) {
      bestScore = result.totalScore;
      bestSet = filled;
    }

    if (totalRuns % 1000 === 0) {
      setProgress((totalRuns / TOTAL_RUNS) * 100);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const avgScore = validRuns > 0 ? (sumScore / validRuns).toFixed(2) : "N/A";
  const time = ((performance.now() - start) / 1000).toFixed(2);

  let summary = `🏁 Total Runs: ${TOTAL_RUNS}
✅ Valid Runs: ${validRuns}
💀 Core Violations: ${coreFails}
⭐ Best (lowest >0): ${bestScore === Infinity ? "None" : bestScore}
📊 Avg Score: ${avgScore}
⏱️ Time: ${time}s`;

  if (bestSet) {
    summary += `\n\n🏆 Best Composition:\n`;
    for (const g of bestSet.groups) {
      const names = g.members.map((m) => m.name).join("、");
      summary += `组 ${g.index + 1}: ${names}\n`;
    }

    // 🟢 Auto-upload to backend
    await uploadBestSet(bestSet, scheduleId);
  }

  setSummary(summary);
}

/** === Core Engine for Extreme Mode === */
async function runUntilValidSolver(
  characters: Character[],
  checkedAbilities: { name: string; level: number; available: boolean }[],
  scheduleId: string,
  setProgress: (p: number) => void,
  setSummary: (txt: string) => void
) {
  const start = performance.now();
  const charsWithNeeds = ComputeNeeds(characters, checkedAbilities);
  const accountCaps = toAccountCapabilities(charsWithNeeds);
  const groupCount = Math.ceil(characters.length / 3);
  const tol = calculateTolerance(charsWithNeeds, groupCount);

  const TARGET_VALID_RUNS = 20000;
  const SAFETY_MULTIPLIER = 50;

  const weekCoreAbilities: string[] = [];
  for (const base of CORE_ABILITIES) {
    const foundLevels = checkedAbilities
      .filter((a) => a.name.startsWith(base))
      .map((a) => `${a.name}${a.level}`);
    weekCoreAbilities.push(...foundLevels);
  }

  let totalAttempts = 0;
  let validRuns = 0;
  let coreFails = 0;
  let sumScore = 0;
  let bestScore = Infinity;
  let bestSet: any = null;

  while (validRuns < TARGET_VALID_RUNS) {
    totalAttempts++;
    const shuffledCaps = [...accountCaps].sort(() => Math.random() - 0.5);
    const skeleton = generateAccountSkeletons(shuffledCaps)[0];
    if (!skeleton) continue;

    const filledArr = fillSkeletonsWithCharacters([skeleton], charsWithNeeds);
    if (filledArr.length === 0) {
      if (totalAttempts > TARGET_VALID_RUNS * SAFETY_MULTIPLIER) break;
      continue;
    }
    const filled = filledArr[0];

    const result = runReversedSolver({
      groups: filled.groups.map((g) => ({
        index: g.index,
        members: g.members.map((m) => ({
          _id: m._id,
          name: m.name,
          account: m.account,
          needs: m.needs,
        })),
      })),
      abilitySummary: tol,
      coreAbilities: weekCoreAbilities,
    });

    if (result.status === "core_violation") {
      coreFails++;
      continue;
    }

    validRuns++;
    sumScore += result.totalScore;
    if (result.totalScore > 0 && result.totalScore < bestScore) {
      bestScore = result.totalScore;
      bestSet = filled;
    }

    if (validRuns % 100 === 0) {
      const percent = (validRuns / TARGET_VALID_RUNS) * 100;
      setProgress(percent);
      await new Promise((r) => setTimeout(r, 0));
    }

    if (totalAttempts > TARGET_VALID_RUNS * SAFETY_MULTIPLIER) break;
  }

  const avgScore = validRuns > 0 ? (sumScore / validRuns).toFixed(2) : "N/A";
  const time = ((performance.now() - start) / 1000).toFixed(2);

  let summary = `Target Valid Runs: ${TARGET_VALID_RUNS}
Total Attempts: ${totalAttempts}
✅ Valid Runs: ${validRuns}
Core Violations: ${coreFails}
Best (lowest >0): ${bestScore === Infinity ? "None" : bestScore}
Avg Score: ${avgScore}
Time: ${time}s`;

  if (bestSet) {
    summary += `\n\nBest Composition:\n`;
    for (const g of bestSet.groups) {
      const names = g.members.map((m) => m.name).join("、");
      summary += `组 ${g.index + 1}: ${names}\n`;
    }

    // 🟢 Auto-upload to backend
    await uploadBestSet(bestSet, scheduleId);
  }

  setSummary(summary);
}

/** === Component === */
export default function ReversedSolver({
  characters,
  checkedAbilities,
  scheduleId,
}: {
  characters: Character[];
  checkedAbilities: { name: string; level: number; available: boolean }[];
  scheduleId: string;
}) {
  const [tolerance, setTolerance] = useState<
    { ability: string; neededGroups: number }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!characters?.length || !checkedAbilities?.length) return;
    const charsWithNeeds = ComputeNeeds(characters, checkedAbilities);
    const groupCount = Math.ceil(characters.length / 3);
    const tol = calculateTolerance(charsWithNeeds, groupCount);
    setTolerance(tol);
  }, [characters, checkedAbilities]);

  const runQuick = async () => {
    setIsRunning(true);
    setProgress(0);
    setSummary("");
    await runFixedSolver(characters, checkedAbilities, scheduleId, setProgress, setSummary);
    setIsRunning(false);
  };

  const runExtreme = async () => {
    setIsRunning(true);
    setProgress(0);
    setSummary("");
    await runUntilValidSolver(characters, checkedAbilities, scheduleId, setProgress, setSummary);
    setIsRunning(false);
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}> Reversed Solver — 双模式运行</h3>

      {/* === Control Panel === */}
      <div className={styles.controls}>
        <button
          onClick={runQuick}
          disabled={isRunning}
          className={styles.runButton}
        >
          {isRunning ? " Running..." : "▶ Quick Mode (20,000 Total Runs)"}
        </button>

        <button
          onClick={runExtreme}
          disabled={isRunning}
          className={styles.runButton}
        >
          {isRunning ? " Running..." : " Extreme Mode (20,000 Valid Runs)"}
        </button>

        {isRunning && (
          <div className={styles.progressBar}>
            <progress value={progress} max="100"></progress>
            <span>{progress.toFixed(1)}%</span>
          </div>
        )}

        {summary && <pre className={styles.summaryBox}>{summary}</pre>}
      </div>

      {/* === Collapsible Tolerance Table === */}
      {tolerance.length > 0 && (
        <div className={styles.toleranceBox}>
          <details>
            <summary className={styles.collapseHeader}>
              📊 能力需求组数（点击展开）
            </summary>
            <div className={styles.collapseContent}>
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
          </details>
        </div>
      )}
    </div>
  );
}
