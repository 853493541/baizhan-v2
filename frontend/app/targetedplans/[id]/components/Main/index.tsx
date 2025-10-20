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

// ✅ Main characters are prioritized when reordering
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
    planId?: string;
    type?: string;
    server: string;
    conflictLevel?: number;
    characters: Character[];
    checkedAbilities?: AbilityCheck[];
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
  checkedAbilities?: AbilityCheck[]; // optional override for targeted plans
}

export default function MainSection({
  schedule,
  groups,
  setGroups,
  setActiveIdx,
  checkGroupQA,
  checkedAbilities,
}: Props) {
  const [solving, setSolving] = useState(false);
  const [aftermath, setAftermath] = useState<{ wasted9: number; wasted10: number } | null>(null);

  // ✅ Source of ability list (fallback safe)
  const allAbilities: AbilityCheck[] =
    checkedAbilities && checkedAbilities.length > 0
      ? checkedAbilities
      : Array.isArray(schedule?.checkedAbilities)
      ? schedule.checkedAbilities
      : [];

  // ✅ Helper for ability unique key
  const keyFor = (a: AbilityCheck) => `${a.name}-${a.level ?? 10}`;

  // ✅ Toggle state for ability filtering
  const [enabledAbilities, setEnabledAbilities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Array.isArray(allAbilities) && allAbilities.length > 0) {
      setEnabledAbilities(Object.fromEntries(allAbilities.map((a) => [keyFor(a), true])));
    }
  }, [allAbilities]);

  // ✅ Auto update aftermath summary on group change
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

  // ---------- Run solver safely ----------
  const safeRunSolver = async (abilities: AbilityCheck[], label: string) => {
    if (solving) return console.log(`[SAFE] Skipping ${label}, already running.`);
    try {
      setSolving(true);
      console.log(`🧩 Running solver with ${label}`);
      const results = runAdvancedSolver(schedule.characters, abilities, 3);
      const reordered = reorderGroups(results);
      setGroups(reordered);
      await saveGroups(reordered);
    } catch (err) {
      console.error("❌ Solver failed:", err);
    } finally {
      setSolving(false);
    }
  };

  // ---------- Save groups (includes characterId + abilities) ----------
  const saveGroups = async (results: GroupResult[]) => {
    const payload = results.map((g, idx) => ({
      index: idx + 1,
      // ✅ Each entry must include characterId for backend validation
      characters: g.characters.map((c) => ({
        characterId: c._id || c.characterId || c.id || null,
        abilities:
          Array.isArray(c.abilities) && c.abilities.length > 0
            ? c.abilities
            : ["", "", ""], // default placeholder
      })),
      status: g.status || "not_started",
      kills: g.kills || [],
    }));

    // 🔹 Filter out any empty/null characterId objects to prevent validation failure
    payload.forEach((group) => {
      group.characters = group.characters.filter((c) => !!c.characterId);
    });

    const isTargeted = schedule.type === "targeted";
    const idField = isTargeted ? schedule.planId : schedule._id;
    const endpoint = isTargeted ? "targeted-plans" : "standard-schedules";

    console.log("📤 [DEBUG] Sending payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}/${idField}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups: payload }),
        }
      );
      if (!res.ok) throw new Error(`Failed to update groups (${res.status})`);
      await res.json();
      console.log(`💾 Groups saved to ${endpoint} (${idField}) ✅`);
    } catch (err) {
      console.error(`❌ Error saving groups to ${endpoint}:`, err);
    }
  };

  // ---------- Reorder groups so 大号组 first ----------
  const reorderGroups = (inputGroups: GroupResult[]) => {
    const mainGroups = inputGroups.filter((g) =>
      g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
    );
    const altGroups = inputGroups.filter(
      (g) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
    );
    return [...mainGroups, ...altGroups].map((g, idx) => ({ ...g, index: idx + 1 }));
  };

  // ---------- Auto reorder detection ----------
  useEffect(() => {
    if (groups.length > 0) {
      const reordered = reorderGroups(groups);
      const isDifferent = reordered.some((g, idx) => g.index !== groups[idx]?.index);
      if (isDifferent) {
        setGroups(reordered);
        saveGroups(reordered);
      }
    }
  }, [groups]);

  // ---------- Split groups for display ----------
  const mainPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const altPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const finishedCount = groups.filter((g) => g.status === "finished").length;
  const shouldLock = groups.some(
    (g) => g.status === "started" || g.status === "finished"
  );

  // ✅ Get active (enabled) abilities
  const getActiveAbilities = () =>
    allAbilities.filter((a) => enabledAbilities[keyFor(a)] !== false);

  // ---------- Render ----------
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>
        已完成小组: {finishedCount} / {groups.length}
      </p>

      {/* === Solver control bar === */}
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
              conflictLevel={schedule.conflictLevel ?? 0}
              checkedAbilities={allAbilities}
            />
          )}
          {altPairs.length > 0 && (
            <DisplayGroups
              title="小号组"
              groups={altPairs}
              setActiveIdx={setActiveIdx}
              checkGroupQA={checkGroupQA}
              conflictLevel={schedule.conflictLevel ?? 0}
              checkedAbilities={allAbilities}
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
