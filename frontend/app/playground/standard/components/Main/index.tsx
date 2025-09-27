"use client";

import styles from "./styles.module.css";
import { runSolver, GroupResult, Character, AbilityCheck } from "@/utils/solver";

interface Props {
  schedule: {
    _id: string;
    server: string;
    conflictLevel: number;
    checkedAbilities: AbilityCheck[];
    characters: Character[];
  };
  groups: GroupResult[];
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
  "唐逍风",
  "程老黑",
]);

export default function MainSection({
  schedule,
  groups,
  setGroups,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  // ✅ Run solver + save to backend
  const handleRunSolver = async (retryCount = 0) => {
    console.log("🧩 Running solver with:", schedule.characters);

    const results = runSolver(
      schedule.characters,
      schedule.checkedAbilities,
      3 // group size (adjust if needed)
    );

    console.log("✅ Solver results:", results);

    // 🔎 Conflict check flags
    let hasConflict = false;

    // 1️⃣ Main-character rule
    results.forEach((g, idx) => {
      const mainsInGroup = g.characters.filter((c) =>
        MAIN_CHARACTERS.has(c.name)
      );
      if (mainsInGroup.length > 1) {
        hasConflict = true;
        console.warn(
          `⚠️ Group ${idx + 1} contains multiple main characters:`,
          mainsInGroup.map((c) => c.name)
        );
        console.debug(
          `📝 Full member list for Group ${idx + 1}:`,
          g.characters.map((c) => `${c.name} (${c.role})`)
        );
      }
    });

    // 2️⃣ 七秀 rule (only for server=乾坤一掷)
    if (schedule.server === "乾坤一掷") {
      results.forEach((g, idx) => {
        const hasSevenShow = g.characters.some((c) => c.class === "七秀");
        if (!hasSevenShow) {
          hasConflict = true;
          console.warn(
            `⚠️ Group ${idx + 1} has no 七秀 (server=${schedule.server})`
          );
          console.debug(
            `📝 Full member list for Group ${idx + 1}:`,
            g.characters.map((c) => `${c.name} (${c.class})`)
          );
        }
      });
    }

    // 🔁 Retry up to 20 times if conflict found
    if (hasConflict && retryCount < 20) {
      console.log(`🔄 Rerunning solver (attempt ${retryCount + 1}/20)...`);
      return handleRunSolver(retryCount + 1);
    }

    // ✅ Accept results if no conflict or max retries reached
    setGroups(results);

    // Build payload for backend
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

  // 🔎 Build paired arrays with original indices preserved
  const mainPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const altPairs = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !g.characters.some((c) => MAIN_CHARACTERS.has(c.name)));

  const renderGroup = (g: GroupResult, originalIdx: number) => {
    const qaWarnings = checkGroupQA(
      g,
      schedule.conflictLevel,
      schedule.checkedAbilities
    );

    return (
      <div
        key={originalIdx}
        className={styles.groupCard}
        onClick={() => setActiveIdx(originalIdx)}
      >
        <h4 className={styles.groupTitle}>组 {originalIdx + 1}</h4>
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

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>

      <button className={styles.solverBtn} onClick={() => handleRunSolver(0)}>
        一键排表
      </button>

      {groups.length === 0 ? (
        <p className={styles.empty}>暂无排表结果</p>
      ) : (
        <>
          {/* 大号组 */}
          {mainPairs.length > 0 && (
            <>
              <h3 className={styles.sectionSubtitle}>大号组</h3>
              <div className={styles.groupsGrid}>
                {mainPairs.map(({ g, i }) => renderGroup(g, i))}
              </div>
            </>
          )}

          {/* 小号组 */}
          {altPairs.length > 0 && (
            <>
              <h3 className={styles.sectionSubtitle}>小号组</h3>
              <div className={styles.groupsGrid}>
                {altPairs.map(({ g, i }) => renderGroup(g, i))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
