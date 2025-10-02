"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runSolver, GroupResult, Character, AbilityCheck } from "@/utils/solver";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import { getDefaultModeChecklist, getDefaultAbilityPool } from "@/utils/playgroundHelpers";
import tradableAbilities from "@/app/data/tradable_abilities.json";

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

// ✅ Hardcoded main characters
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

export default function MainSection({
  schedule,
  groups,
  setGroups,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  const [aftermath, setAftermath] = useState<{ wasted9: number; wasted10: number } | null>(null);

  // 🔑 Advanced solver ability pools
  const [coreAbilities, setCoreAbilities] = useState<AbilityCheck[]>([]);
  const [allAbilities, setAllAbilities] = useState<AbilityCheck[]>([]);
  const [loadingCore, setLoadingCore] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);

  // Load Core 8
  useEffect(() => {
    const fetchCoreAbilities = async () => {
      setLoadingCore(true);
      try {
        const core8 = await getDefaultModeChecklist();
        const checks: AbilityCheck[] = core8.map((a) => ({ ...a, available: true }));
        setCoreAbilities(checks);
      } catch (err) {
        console.error("❌ Failed to load core abilities:", err);
      } finally {
        setLoadingCore(false);
      }
    };
    fetchCoreAbilities();
  }, []);

  // Load Full Pool (minus tradables)
  useEffect(() => {
    const fetchAllAbilities = async () => {
      setLoadingAll(true);
      try {
        const pool = await getDefaultAbilityPool();
        const filtered = pool.filter((a) => !tradableAbilities.includes(a.name));
        const checks: AbilityCheck[] = filtered.map((a) => ({ ...a, available: true }));
        setAllAbilities(checks);
      } catch (err) {
        console.error("❌ Failed to load full ability pool:", err);
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAllAbilities();
  }, []);

  // ✅ Whenever groups change, recalc aftermath totals
  useEffect(() => {
    if (groups.length > 0) {
      summarizeAftermath(groups).then(setAftermath).catch((err) => {
        console.error("❌ Error summarizing aftermath:", err);
        setAftermath(null);
      });
    } else {
      setAftermath(null);
    }
  }, [groups]);

  // ========== Handlers ==========

  // Old Solver
  const handleRunSolver = async (retryCount = 0) => {
    console.log("🧩 Running OLD solver with:", schedule.characters);

    const results = runSolver(schedule.characters, schedule.checkedAbilities, 3);
    console.log("✅ Old Solver results:", results);

    setGroups(results);
    await saveGroups(results);
  };

  // Advanced Solver
  const handleRunAdvancedSolver = async (abilities: AbilityCheck[], label: string) => {
    if (abilities.length === 0) {
      console.warn(`⚠️ No abilities loaded for ${label}`);
      return;
    }
    console.log(`🧩 Running ADVANCED solver with ${label}`);
    const results = runAdvancedSolver(schedule.characters, abilities, 3);
    console.log(`✅ Advanced Solver results (${label}):`, results);

    setGroups(results);
    await saveGroups(results);
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

  // ========== Rendering ==========

  const finishedCount = groups.filter((g) => g.status === "finished").length;

  const renderGroup = (
    g: GroupResult & { status?: "not_started" | "started" | "finished" },
    originalIdx: number
  ) => {
    const qaWarnings = checkGroupQA(g, schedule.conflictLevel, schedule.checkedAbilities);
    const status = g.status || "not_started";

    const renderStatus = () => {
      switch (status) {
        case "started":
          return <span className={`${styles.statusDot} ${styles.started}`}>● <span className={styles.statusText}>进行中</span></span>;
        case "finished":
          return <span className={`${styles.statusDot} ${styles.finished}`}>● <span className={styles.statusText}>完成</span></span>;
        default:
          return <span className={`${styles.statusDot} ${styles.notStarted}`}>● <span className={styles.statusText}>未开始</span></span>;
      }
    };

    return (
      <div key={originalIdx} className={styles.groupCard} onClick={() => setActiveIdx(originalIdx)}>
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
                  c.role === "Tank" ? styles.tank : c.role === "Healer" ? styles.healer : styles.dps
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

  const mainPairs = groups.map((g, i) => ({ g, i })).filter(({ g }) =>
    g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
  );
  const altPairs = groups.map((g, i) => ({ g, i })).filter(({ g }) =>
    !g.characters.some((c) => MAIN_CHARACTERS.has(c.name))
  );

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>
      <p className={styles.finishedCount}>已完成小组: {finishedCount} / {groups.length}</p>

      {/* Old solver */}
      <button className={styles.solverBtn} onClick={() => handleRunSolver(0)}>
        一键排表 (旧版)
      </button>

      {/* Advanced solver - Core */}
      <button className={styles.solverBtn} disabled={loadingCore} onClick={() => handleRunAdvancedSolver(coreAbilities, "Core 8")}>
        {loadingCore ? "加载核心技能..." : "高级排表 (核心技能)"}
      </button>

      {/* Advanced solver - Full */}
      <button className={styles.solverBtn} disabled={loadingAll} onClick={() => handleRunAdvancedSolver(allAbilities, "Full Pool")}>
        {loadingAll ? "加载全部技能..." : "高级排表 (全部技能)"}
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
