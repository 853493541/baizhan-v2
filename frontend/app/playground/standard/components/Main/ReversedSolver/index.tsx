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
  // "乾坤一掷",
  // "飞云回转刀",
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

/** === Core Engine: run 20k solver checks with safety & retries === */
async function runMassSolver(
  characters: Character[],
  checkedAbilities: { name: string; level: number; available: boolean }[],
  setProgress: (p: number) => void,
  setSummary: (txt: string) => void
) {
  const start = performance.now();
  const charsWithNeeds = ComputeNeeds(characters, checkedAbilities);
  const accountCaps = toAccountCapabilities(charsWithNeeds);

  const skeletonCount = 40; // outer loop
  const variantsPerSkeleton = 500; // inner loop → 20k runs total
  const groupCount = Math.ceil(characters.length / 3);
  const tol = calculateTolerance(charsWithNeeds, groupCount);

  // 🔍 Build weekly core list (Lv9 + Lv10)
  const weekCoreAbilities: string[] = [];
  for (const base of CORE_ABILITIES) {
    const foundLevels = checkedAbilities
      .filter((a) => a.name.startsWith(base))
      .map((a) => `${a.name}${a.level}`);
    weekCoreAbilities.push(...foundLevels);
  }

  // === Stats ===
  let totalRuns = 0;
  let validRuns = 0;
  let coreFails = 0;
  let sumScore = 0;
  let bestScore = Infinity;
  let bestSet: any = null;

  console.log(
    `[Mass Solver] Starting full random run: Skeletons=${skeletonCount}, Variants=${variantsPerSkeleton}`
  );

  // === MAIN LOOP ===
  for (let s = 0; s < skeletonCount; s++) {
    for (let v = 0; v < variantsPerSkeleton; v++) {
      totalRuns++;

      // 🟢 Full random shuffle → new skeleton each time
      const shuffledCaps = [...accountCaps].sort(() => Math.random() - 0.5);
      const skeleton = generateAccountSkeletons(shuffledCaps)[0];
      if (!skeleton) continue;

      // 🌀 Attempt to fill up to 5 times
      let filledAttempt: any = null;
      for (let retry = 0; retry < 5; retry++) {
        const tryFill = fillSkeletonsWithCharacters([skeleton], charsWithNeeds);
        if (tryFill.length > 0) {
          filledAttempt = tryFill[0];
          break;
        }
      }
      if (!filledAttempt) continue; // skip if still invalid

      const filled = filledAttempt;

      // 🧩 Debug first few runs
      if (totalRuns <= 3) {
        console.log(
          `[Debug] Run #${totalRuns} (${filled.groups.length} groups):`,
          filled.groups.map((g) => g.members.map((m) => m.name).join("、"))
        );
      }

      // 🧮 Run solver on this filled set
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

      // ⚠️ Skip if core violation
      if (result.status === "core_violation") {
        coreFails++;
        continue;
      }

      validRuns++;
      sumScore += result.totalScore;

      // 🏆 Track best (lowest positive) score
      if (result.totalScore > 0 && result.totalScore < bestScore) {
        bestScore = result.totalScore;
        bestSet = filled;
      }

      // 🕓 Periodic progress update
      if (totalRuns % 1000 === 0) {
        setProgress((totalRuns / (skeletonCount * variantsPerSkeleton)) * 100);
        await new Promise((r) => setTimeout(r, 0)); // yield to UI
      }
    }
  }

  // === SUMMARY ===
  const avgScore =
    validRuns > 0 ? (sumScore / validRuns).toFixed(2) : "N/A";
  const time = ((performance.now() - start) / 1000).toFixed(2);

  let summary = `🏁 Total Runs: ${totalRuns}
✅ Valid Runs: ${validRuns}
Core Violations: ${coreFails}
Best (lowest >0): ${bestScore === Infinity ? "None" : bestScore}
Avg Score: ${avgScore}
⏱Time: ${time}s`;

  // === BEST COMPOSITION ===
  if (bestSet) {
    summary += `\n\nBest Composition:\n`;
    for (const g of bestSet.groups) {
      const names = g.members.map((m) => m.name).join("、");
      summary += `组 ${g.index + 1}: ${names}\n`;
    }
  }

  setSummary(summary);
  console.log("[Mass Solver] Finished\n" + summary);
}

/** === Component === */
export default function ReversedSolver({
  characters,
  checkedAbilities,
}: {
  characters: Character[];
  checkedAbilities: { name: string; level: number; available: boolean }[];
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

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>🧩 Reversed Solver — 最佳组合搜索 (20,000次)</h3>

      {/* === Control Panel === */}
      <div className={styles.controls}>
        <button
          onClick={async () => {
            setIsRunning(true);
            setProgress(0);
            setSummary("");
            await runMassSolver(
              characters,
              checkedAbilities,
              setProgress,
              setSummary
            );
            setIsRunning(false);
          }}
          disabled={isRunning}
          className={styles.runButton}
        >
          {isRunning ? "⏳ Running..." : "▶ Run Mass Solver"}
        </button>

        {isRunning && (
          <div className={styles.progressBar}>
            <progress value={progress} max="100"></progress>
            <span>{progress.toFixed(1)}%</span>
          </div>
        )}

        {summary && <pre className={styles.summaryBox}>{summary}</pre>}
      </div>

      {/* === Tolerance Table === */}
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
    </div>
  );
}
