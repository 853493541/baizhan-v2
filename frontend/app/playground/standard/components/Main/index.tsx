"use client";

import styles from "./styles.module.css";
import { runSolver, GroupResult, Character, AbilityCheck } from "@/utils/solver";

interface Props {
  schedule: {
    _id: string;
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

export default function MainSection({
  schedule,
  groups,
  setGroups,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  // ✅ Run solver + save to backend
  const handleRunSolver = async () => {
    console.log("🧩 Running solver with:", schedule.characters);

    const results = runSolver(
      schedule.characters,
      schedule.checkedAbilities,
      3 // group size (adjust if needed)
    );

    console.log("✅ Solver results:", results);
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

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>排表区域</h3>

      <button className={styles.solverBtn} onClick={handleRunSolver}>
        一键排表
      </button>

      {groups.length === 0 ? (
        <p className={styles.empty}>暂无排表结果</p>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((g, idx) => {
            const qaWarnings = checkGroupQA(
              g,
              schedule.conflictLevel,
              schedule.checkedAbilities
            );
            return (
              <div
                key={idx}
                className={styles.groupCard}
                onClick={() => setActiveIdx(idx)}
              >
                <h4 className={styles.groupTitle}>组 {idx + 1}</h4>
                <ul className={styles.memberList}>
                  {g.characters.map((c) => (
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
                      {c.name}
                    </li>
                  ))}
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
          })}
        </div>
      )}
    </div>
  );
}
