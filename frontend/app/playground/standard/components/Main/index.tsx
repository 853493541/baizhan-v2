"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

import SolverOptions from "./SolverOptions";
import SolverButtons from "./SolverButtons";
import DisplayGroups from "./DisplayGroups";
import AftermathSummary from "./AftermathSummary";
import ReversedSolver from "./ReversedSolver";

// ✅ Hardcoded main characters (still used to split main/alt groups)
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

interface Props {
  schedule: {
    _id: string;
    server: string;
    conflictLevel: number;
    characters: Character[];
    checkedAbilities: AbilityCheck[];
  };
  groups: (GroupResult & { status?: "not_started" | "started" | "finished" })[];
  setGroups: (groups: GroupResult[]) => void;
  activeIdx: number | null;
  setActiveIdx: (idx: number | null) => void;
  checkGroupQA: (
    group: GroupResult,
    conflictLevel: number,
    checkedAbilities: AbilityCheck[]
  ) => string[];
}

export default function MainSection({
  schedule,
  groups,
  setGroups,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  const [solving, setSolving] = useState(false);
  const [aftermath, setAftermath] = useState<{ wasted9: number; wasted10: number } | null>(null);

  // ✅ All abilities from schedule (each has name + level)
  const allAbilities = schedule.checkedAbilities;

  // ✅ Helper: unique key per ability/level
  const keyFor = (a: AbilityCheck) => `${a.name}-${a.level}`;

  // ✅ Initialize toggle state for all ability levels
  const [enabledAbilities, setEnabledAbilities] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allAbilities.map((a) => [keyFor(a), true]))
  );

  // ✅ Update aftermath on group change
  useEffect(() => {
    if (groups.length > 0) {
      summarizeAftermath(groups)
        .then(setAftermath)
        .catch((err) => {
          console.error("❌ Error summarizing aftermath:", err);
          setAftermath(null);
        });
    } else {
      setAftermath(null);
    }
  }, [groups]);

  // ---------- Safe Solver Wrapper ----------
  const safeRunSolver = async (abilities: AbilityCheck[], label: string) => {
    if (solving) {
      console.log(`[SAFE] Skipping ${label}, solver already running.`);
      return;
    }
    try {
      setSolving(true);
      console.log(`🧩 Running solver with ${label}`);
      const results = runAdvancedSolver(schedule.characters, abilities, 3);
      console.log(`✅ Solver results (${label}):`, results);

      const reordered = reorderGroups(results);
      setGroups(reordered);
      await saveGroups(reordered);
    } catch (err) {
      console.error("❌ Solver failed:", err);
    } finally {
      setSolving(false);
    }
  };

  // ---------- Save groups to backend ----------
  const saveGroups = async (results: GroupResult[]) => {
    const payload = results.map((g, idx) => ({
      index: idx + 1,
      characters: g.characters.map((c) => c._id),
    }));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${schedule._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups: payload }),
        }
      );
      if (!res.ok) throw new Error("Failed to update groups");
      await res.json();
      console.log("💾 Groups saved to backend");
    } catch (err) {
      console.error("❌ Error saving groups:", err);
    }
  };

  // ---------- Helper: reorder groups so 大号组 first ----------
  const reorderGroups = (inputGroups: GroupResult[]) => {
    const mainGroups = inputGroups.filter((g) =>
      g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
    );
    const altGroups = inputGroups.filter(
      (g) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
    );

    const reordered = [...mainGroups, ...altGroups].map((g, idx) => ({
      ...g,
      index: idx + 1,
    }));

    if (mainGroups.length && altGroups.length) {
      console.log(`🔄 Reordered groups: ${mainGroups.length} main, ${altGroups.length} alt`);
    }

    return reordered;
  };

  // ---------- Auto reorder existing groups ----------
  useEffect(() => {
    if (groups.length > 0) {
      const reordered = reorderGroups(groups);
      const isDifferent = reordered.some((g, idx) => g.index !== groups[idx]?.index);
      if (isDifferent) {
        console.log("🔁 Detected index mismatch, saving reordered groups...");
        setGroups(reordered);
        saveGroups(reordered);
      }
    }
  }, [groups]);

  // ---------- Split groups for rendering ----------
  const mainPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const altPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  // ---------- Render ----------
  const finishedCount = groups.filter((g) => g.status === "finished").length;

  const shouldLock = groups.some(
    (g) => g.status === "started" || g.status === "finished"
  );

  // ✅ Build list of abilities currently toggled ON (name-level aware)
  const getActiveAbilities = () =>
    allAbilities.filter((a) => enabledAbilities[keyFor(a)] !== false);

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>
        已完成小组: {finishedCount} / {groups.length}
      </p>

      {/* ✅ Solver control bar (Gear + Buttons side by side) */}
      <div className={styles.solverBar}>
        <SolverOptions
          allAbilities={allAbilities.map((a) => ({ name: a.name, level: a.level }))}
          enabledAbilities={enabledAbilities}
          setEnabledAbilities={setEnabledAbilities}
        />
        <SolverButtons
          solving={solving}
          disabled={shouldLock}
          onCore={() => safeRunSolver(getActiveAbilities(), "Custom (Selected)")}
          onFull={() => safeRunSolver(allAbilities, "Full Pool")}
        />
      </div>
      <ReversedSolver characters={schedule.characters}
       checkedAbilities={schedule.checkedAbilities}
        />
      
      {groups.length === 0 ? (
        <p className={styles.empty}>暂无排表结果</p>
      ) : (
        <>
          {mainPairs.length > 0 && (
            <DisplayGroups
              title="大号组"
              groups={mainPairs}
              setActiveIdx={setActiveIdx}
              checkGroupQA={checkGroupQA}
              conflictLevel={schedule.conflictLevel}
              checkedAbilities={schedule.checkedAbilities}
            />
          )}
          {altPairs.length > 0 && (
            <DisplayGroups
              title="小号组"
              groups={altPairs}
              setActiveIdx={setActiveIdx}
              checkGroupQA={checkGroupQA}
              conflictLevel={schedule.conflictLevel}
              checkedAbilities={schedule.checkedAbilities}
            />
          )}
          {aftermath && (
            <AftermathSummary
              wasted9={aftermath.wasted9}
              wasted10={aftermath.wasted10}
            />
          )}
        </>
      )}
    </div>
  );
}
