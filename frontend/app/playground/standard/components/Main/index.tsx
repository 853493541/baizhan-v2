"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

import SolverButtons from "./SolverButtons";
import DisplayGroups from "./DisplayGroups";
import AftermathSummary from "./AftermathSummary";

// ✅ Hardcoded main characters (still used to split main/alt groups)
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

// ✅ Core abilities (subset)
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

  // ✅ derive abilities
  const allAbilities = schedule.checkedAbilities;
  const coreAbilities = allAbilities.filter((a) => CORE_ABILITIES.includes(a.name));

  // ✅ update aftermath on group change
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

      setGroups(results);
      await saveGroups(results);
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

  // ---------- Split groups ----------
  const mainPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const altPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  // ---------- Render ----------
  const finishedCount = groups.filter((g) => g.status === "finished").length;

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>
        已完成小组: {finishedCount} / {groups.length}
      </p>

      {/* Solver buttons */}
      <SolverButtons
        solving={solving}
        onCore={() => safeRunSolver(coreAbilities, "Core 8")}
        onFull={() => safeRunSolver(allAbilities, "Full Pool")}
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
            <AftermathSummary wasted9={aftermath.wasted9} wasted10={aftermath.wasted10} />
          )}
        </>
      )}
    </div>
  );
}
