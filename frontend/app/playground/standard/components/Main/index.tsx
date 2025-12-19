"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

import SolverOptions from "./SolverOptions";
import SolverButtons from "./SolverButtons";
import DisplayGroups from "./DisplayGroups";
import EditAllGroupsModal from "./EditAllGroupsModal";

/* 🔥 ORDERED main character priority */
const MAIN_CHARACTERS = [
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
] as const;

const MAIN_ORDER_MAP = new Map(
  MAIN_CHARACTERS.map((name, idx) => [name, idx])
);

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
  activeIdx,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  const [solving, setSolving] = useState(false);
  const [aftermath, setAftermath] =
    useState<{ wasted9: number; wasted10: number } | null>(null);
  const [showEditAll, setShowEditAll] = useState(false);

  const allAbilities = schedule.checkedAbilities;
  const keyFor = (a: AbilityCheck) => `${a.name}-${a.level}`;

  const [enabledAbilities, setEnabledAbilities] = useState<Record<string, boolean>>(
    () => Object.fromEntries(allAbilities.map((a) => [keyFor(a), true]))
  );

  useEffect(() => {
    if (groups.length > 0) {
      summarizeAftermath(groups)
        .then(setAftermath)
        .catch(() => setAftermath(null));
    } else setAftermath(null);
  }, [groups]);

  /* ---------------------------------------------------
     🔥 SOLVER — updates everything using PUT endpoint
  --------------------------------------------------- */
  const safeRunSolver = async (abilities: AbilityCheck[], label: string) => {
    if (solving) return;
    try {
      setSolving(true);
      const results = runAdvancedSolver(schedule.characters, abilities, 3);
      const reordered = reorderGroups(results);
      setGroups(reordered);
      await saveGroups(reordered);
    } finally {
      setSolving(false);
    }
  };

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
    } catch (err) {
      console.error("❌ Save error:", err);
    }
  };

  /* ---------------------------------------------------
     🔥 Automatic reordering (main → alt, priority-aware)
  --------------------------------------------------- */
  const reorderGroups = (inputGroups: GroupResult[]) => {
    const getPriority = (g: GroupResult) => {
      let best = Infinity;
      for (const c of g.characters) {
        const order = MAIN_ORDER_MAP.get(c.name);
        if (order !== undefined) {
          best = Math.min(best, order);
        }
      }
      return best;
    };

    const main = inputGroups
      .map((g) => ({ g, priority: getPriority(g) }))
      .filter(({ priority }) => priority !== Infinity)
      .sort((a, b) => a.priority - b.priority)
      .map(({ g }) => g);

    const alt = inputGroups.filter(
      (g) => !g.characters.some((c) => MAIN_ORDER_MAP.has(c.name))
    );

    return [...main, ...alt].map((g, idx) => ({ ...g, index: idx + 1 }));
  };

  useEffect(() => {
    if (!groups.length) return;
    const reordered = reorderGroups(groups);
    const diff = reordered.some((g, i) => g.index !== groups[i]?.index);
    if (diff) {
      setGroups(reordered);
      saveGroups(reordered);
    }
  }, [groups]);

  /* ---------------------------------------------------
     🔥 Automatic lock when groups are started
  --------------------------------------------------- */
  const shouldLock = groups.some((g) => (g.status ?? "not_started") !== "not_started");

  /* ---------------------------------------------------
     UI rendering
  --------------------------------------------------- */
  const mainPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_ORDER_MAP.has(c.name)));

  const altPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_ORDER_MAP.has(c.name)));

  const finishedCount = groups.filter((g) => g.status === "finished").length;

  const getActiveAbilities = () =>
    allAbilities.filter((a) => enabledAbilities[keyFor(a)] !== false);

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>
        已完成小组: {finishedCount} / {groups.length}
      </p>

      {/* ⭐ Solver + Manual Editor */}
      <div className={styles.solverBar}>
        <SolverOptions
          allAbilities={allAbilities.map((a) => ({
            name: a.name,
            level: a.level,
          }))}
          enabledAbilities={enabledAbilities}
          setEnabledAbilities={setEnabledAbilities}
          disabled={shouldLock}
        />

        <SolverButtons
          solving={solving}
          disabled={shouldLock}
          onCore={() => safeRunSolver(getActiveAbilities(), "Custom")}
          onFull={() => safeRunSolver(allAbilities, "Full")}
          onManual={() => setShowEditAll(true)}
        />
      </div>

      {/* ⭐ Groups */}
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
        </>
      )}

      {/* ⭐ Manual Edit Modal */}
      {showEditAll && (
        <EditAllGroupsModal
          groups={groups}
          scheduleId={schedule._id}
          onClose={() => setShowEditAll(false)}
          onSave={(updatedGroups) => {
            setGroups(updatedGroups);
          }}
        />
      )}
    </div>
  );
}
