"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import { GroupResult, Character, AbilityCheck } from "@/utils/solver";
import { checkAndRerun } from "@/utils/rerunLogic";  // rerun logic (disabled for now)

// ✅ Hardcoded main characters
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

// ✅ Core abilities (filtering subset)
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
  const [aftermath, setAftermath] = useState<{ wasted9: number; wasted10: number } | null>(null);
  const [solving, setSolving] = useState(false); // 🚫 Prevent multiple solver runs

  // ✅ derive pools directly from schedule
  const allAbilities = schedule.checkedAbilities;
  const coreAbilities = schedule.checkedAbilities.filter((a) =>
    CORE_ABILITIES.includes(a.name)
  );

  // ✅ Recalculate aftermath when groups change
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

  // Save groups to backend
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

  // ---------- Auto Rerun Logic (DISABLED) ----------
  useEffect(() => {
    const rerunEnabled = false; // 🔒 toggle
    if (!rerunEnabled) {
      console.log("[RERUN] Disabled: rerun logic is skipped (handled in solver).");
      return;
    }

    checkAndRerun(
      groups,
      { solving, runSolver: safeRunSolver, scheduleId: schedule._id },
      coreAbilities
    );
  }, [groups, solving, schedule._id]);

  // ---------- Rendering ----------
  const finishedCount = groups.filter((g) => g.status === "finished").length;

  const renderGroup = (
    g: GroupResult & { status?: "not_started" | "started" | "finished" },
    originalIdx: number
  ) => {
    const qaWarnings = checkGroupQA(
      g,
      schedule.conflictLevel,
      schedule.checkedAbilities
    );
    const status = g.status || "not_started";

    const renderStatus = () => {
      switch (status) {
        case "started":
          return (
            <span className={`${styles.statusDot} ${styles.started}`}>
              ● <span className={styles.statusText}>进行中</span>
            </span>
          );
        case "finished":
          return (
            <span className={`${styles.statusDot} ${styles.finished}`}>
              ● <span className={styles.statusText}>完成</span>
            </span>
          );
        default:
          return (
            <span className={`${styles.statusDot} ${styles.notStarted}`}>
              ● <span className={styles.statusText}>未开始</span>
            </span>
          );
      }
    };

    return (
      <div
        key={originalIdx}
        className={styles.groupCard}
        onClick={() => setActiveIdx(originalIdx)}
      >
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>组 {originalIdx + 1}</h4>
          {renderStatus()}
        </div>
        <ul className={styles.memberList}>
          {g.characters.map((c) => {
            const isMain = MAIN_CHARACTERS.has(c.name);
            return (
              <li
                key={c._id}
                className={`${styles.memberItem} ${
                  c.role === "Tank"
                    ? styles.tank
                    : c.role === "Healer"
                    ? styles.healer
                    : styles.dps
                }`}
              >
                {isMain ? "★ " : ""}
                {c.name}
              </li>
            );
          })}
        </ul>
        {qaWarnings.length > 0 && (
          <div className={styles.groupViolation}>
            {qaWarnings.map((w, i) => (
              <p key={i}>⚠️ {w}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const mainPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const altPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>
        已完成小组: {finishedCount} / {groups.length}
      </p>

      {/* Advanced solver - Core */}
      <button
        className={`${styles.solverBtn} ${styles.coreBtn}`}
        onClick={() => safeRunSolver(coreAbilities, "Core 8")}
        disabled={solving}
      >
        {solving ? "处理中..." : "高级排表 (核心技能)"}
      </button>

      {/* Advanced solver - Full */}
      <button
        className={`${styles.solverBtn} ${styles.fullBtn}`}
        onClick={() => safeRunSolver(allAbilities, "Full Pool")}
        disabled={solving}
      >
        {solving ? "处理中..." : "高级排表 (全部技能)"}
      </button>

      {groups.length === 0 ? (
        <p className={styles.empty}>暂无排表结果</p>
      ) : (
        <>
          {mainPairs.length > 0 && (
            <>
              <h3 className={styles.sectionSubtitle}>大号组</h3>
              <div className={styles.groupsGrid}>
                {mainPairs.map(({ g, i }) => renderGroup(g, i))}
              </div>
            </>
          )}
          {altPairs.length > 0 && (
            <>
              <h3 className={styles.sectionSubtitle}>小号组</h3>
              <div className={styles.groupsGrid}>
                {altPairs.map(({ g, i }) => renderGroup(g, i))}
              </div>
            </>
          )}
          {aftermath && (
            <div className={styles.aftermath}>
              <p>9重技能浪费: {aftermath.wasted9}</p>
              <p>10重技能最多浪费 {aftermath.wasted10}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
