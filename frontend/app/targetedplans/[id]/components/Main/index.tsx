"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

import SolverOptions from "./SolverOptions";
import SolverButtons from "./SolverButtons";
import DisplayGroups from "./DisplayGroups";

import Editor from "./Editor";

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
  checkedAbilities?: AbilityCheck[];
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

  // 🧩 Normalize groups from backend (flatten nested characterId)
  const normalizeGroups = (rawGroups: any[]) => {
    if (!Array.isArray(rawGroups)) return [];
    return rawGroups.map((g) => ({
      ...g,
      characters: Array.isArray(g.characters)
        ? g.characters.map((c) =>
            c.characterId ? { ...c.characterId, ...c } : c
          )
        : [],
    }));
  };

  // 🧩 On mount or refresh, normalize immediately
  useEffect(() => {
    if (groups?.length) {
      const normalized = normalizeGroups(groups);
      setGroups(normalized);
    }
  }, []); // run once on mount

  // ✅ Ability handling
  const allAbilities: AbilityCheck[] =
    checkedAbilities && checkedAbilities.length > 0
      ? checkedAbilities
      : Array.isArray(schedule?.checkedAbilities)
      ? schedule.checkedAbilities
      : [];

  const keyFor = (a: AbilityCheck) => `${a.name}-${a.level ?? 10}`;
  const [enabledAbilities, setEnabledAbilities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Array.isArray(allAbilities) && allAbilities.length > 0) {
      setEnabledAbilities(Object.fromEntries(allAbilities.map((a) => [keyFor(a), true])));
    }
  }, [allAbilities]);

  // ✅ Update aftermath when groups change
  useEffect(() => {
    if (groups.length > 0) {
      summarizeAftermath(groups)
        .then(setAftermath)
        .catch(() => setAftermath(null));
    } else setAftermath(null);
  }, [groups]);

  // ---------- Run solver safely ----------
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

  // ---------- Save groups ----------
  const saveGroups = async (results: GroupResult[]) => {
    const payload = results.map((g, idx) => ({
      index: idx + 1,
      characters: g.characters.map((c) => ({
        characterId: c._id || c.characterId || null,
        abilities:
          Array.isArray(c.abilities) && c.abilities.length > 0 ? c.abilities : ["", "", ""],
      })),
      status: g.status || "not_started",
      kills: g.kills || [],
    }));

    payload.forEach((group) => {
      group.characters = group.characters.filter((c) => !!c.characterId);
    });

    const isTargeted = schedule.type === "targeted";
    const idField = isTargeted ? schedule.planId : schedule._id;
    const endpoint = isTargeted ? "targeted-plans" : "standard-schedules";

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}/${idField}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: payload }),
      });
    } catch {
      console.error("❌ Failed to save groups");
    }
  };

  // ---------- Reorder (flatten before filtering) ----------
  const flattenGroups = (input: any[]) =>
    input.map((g) => ({
      ...g,
      characters: g.characters.map((c) =>
        c.characterId ? { ...c.characterId, ...c } : c
      ),
    }));

  const reorderedGroups = flattenGroups(groups);

  const mainPairs = reorderedGroups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const altPairs = reorderedGroups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const finishedCount = groups.filter((g) => g.status === "finished").length;
  const shouldLock = groups.some((g) => g.status === "started" || g.status === "finished");
  const getActiveAbilities = () => allAbilities.filter((a) => enabledAbilities[keyFor(a)] !== false);

  // ---------- Render ----------
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>
        已完成小组: {finishedCount} / {groups.length}
      </p>

      {/* {
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
      } */}

      {/* === Always render Editor, even when no groups exist === */}
      <Editor
        scheduleId={schedule.planId ?? schedule._id}
        groups={groups}
        setGroups={setGroups}
        allCharacters={schedule.characters}
      />

      {groups.length === 0 && (
        <p className={styles.empty}>暂无排表结果（请创建一个小组）</p>
      )}

      {/* === Aftermath Summary === */}

      {/* === Old Display (kept commented for reference) === */}
      {/* 
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
      */}
    </div>
  );
}
