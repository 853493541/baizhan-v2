"use client";

import { useEffect, useState } from "react";
import { runAdvancedSolver, GroupResult, Character, AbilityCheck } from "@/utils/advancedSolver";
import { getDefaultModeChecklist, getDefaultAbilityPool } from "@/utils/playgroundHelpers";
import tradableAbilities from "@/app/data/tradable_abilities.json"// ✅ import tradables
import styles from "./styles.module.css";

interface Props {
  schedule: {
    _id: string;
    server: string;
    conflictLevel: number;
    characters: Character[];
  };
  groups: (GroupResult & { status?: "not_started" | "started" | "finished" })[];
  setGroups: (groups: GroupResult[]) => void;
}

export default function AdvancedGroups({ schedule, groups, setGroups }: Props) {
  const [coreAbilities, setCoreAbilities] = useState<AbilityCheck[]>([]);
  const [allAbilities, setAllAbilities] = useState<AbilityCheck[]>([]);
  const [loadingCore, setLoadingCore] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);

  // Load only 8 core abilities
  useEffect(() => {
    const fetchCoreAbilities = async () => {
      setLoadingCore(true);
      try {
        const core8 = await getDefaultModeChecklist();
        const checks: AbilityCheck[] = core8.map((a) => ({ ...a, available: true }));
        setCoreAbilities(checks);
        console.log("[AdvancedGroups] Core 8 abilities:", checks);
      } catch (err) {
        console.error("❌ Failed to load core abilities:", err);
      } finally {
        setLoadingCore(false);
      }
    };
    fetchCoreAbilities();
  }, []);

  // Load full weekly ability pool (excluding tradables)
  useEffect(() => {
    const fetchAllAbilities = async () => {
      setLoadingAll(true);
      try {
        const pool = await getDefaultAbilityPool();
        const filtered = pool.filter((a) => !tradableAbilities.includes(a.name)); // ✅ exclude tradables
        const checks: AbilityCheck[] = filtered.map((a) => ({ ...a, available: true }));
        setAllAbilities(checks);
        console.log("[AdvancedGroups] Full ability pool (filtered):", checks);
      } catch (err) {
        console.error("❌ Failed to load full abilities:", err);
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAllAbilities();
  }, []);

  const handleRunSolver = (abilities: AbilityCheck[], label: string) => {
    if (abilities.length === 0) {
      console.warn(`⚠️ No abilities loaded for ${label}`);
      return;
    }

    console.log(`🧩 Running ADVANCED solver with ${label}`);
    console.log("👥 Character count:", schedule.characters.length);
    console.log(`[passing into advanced solver] ${label} abilities:`, abilities);

    const results = runAdvancedSolver(schedule.characters, abilities, 3);
    console.log(`✅ Advanced solver results (${label}):`, results);
    setGroups(results);
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.sectionTitle}>高级排表区域 (测试)</h3>

      <p className={styles.info}>总角色数: {schedule.characters.length}</p>

      {/* Core 8 section */}
      <div className={styles.block}>
        <h4>核心技能</h4>
        {loadingCore ? (
          <p>加载中核心技能...</p>
        ) : (
          <>
            <ul className={styles.list}>
              {coreAbilities.map((a, idx) => (
                <li key={idx}>
                  {a.name} (Lv.{a.level})
                </li>
              ))}
            </ul>
            <button
              className={styles.btn}
              onClick={() => handleRunSolver(coreAbilities, "Core 8")}
            >
              一键排表
            </button>
          </>
        )}
      </div>

      {/* Full abilities section */}
      <div className={styles.block}>
        <h4>其他全部技能</h4>
        {loadingAll ? (
          <p>加载中全部技能...</p>
        ) : (
          <>
            <ul className={styles.list}>
              {allAbilities.slice(0, 15).map((a, idx) => (
                <li key={idx}>
                  {a.name} (Lv.{a.level})
                </li>
              ))}
            </ul>
            {allAbilities.length > 15 && (
              <p className={styles.note}>共 {allAbilities.length} 个技能</p>
            )}
            <button
              className={styles.btn}
              onClick={() => handleRunSolver(allAbilities, "Full Pool")}
            >
              一键排表 (全部技能)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
