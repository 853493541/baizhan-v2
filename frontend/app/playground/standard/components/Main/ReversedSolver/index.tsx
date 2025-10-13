"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import {
  toAccountCapabilities,
  generateAccountSkeletons,
} from "./generateAccountSkeletons";
import { fillSkeletonsWithCharacters } from "./fillSkeletonsWithCharacters";

interface Character {
  _id: string;
  name: string;
  account: string;
  role: "DPS" | "Healer" | "Tank";
}

interface FilledSkeleton {
  index: number;
  groups: {
    index: number;
    members: Character[];
  }[];
}

export default function ReversedSolver({ characters }: { characters: Character[] }) {
  const [filledSkeletons, setFilledSkeletons] = useState<FilledSkeleton[]>([]);

  useEffect(() => {
    if (!characters?.length) return;

    const accountCaps = toAccountCapabilities(characters);
    const skeletonSets: FilledSkeleton[] = [];

    // ✅ Generate 10 sets (randomized)
    for (let i = 0; i < 10; i++) {
      const shuffled = [...accountCaps].sort(() => Math.random() - 0.5);
      const skeleton = generateAccountSkeletons(shuffled);
      const filled = fillSkeletonsWithCharacters(skeleton, characters);
      if (filled.length > 0) skeletonSets.push({ ...filled[0], index: i });
    }

    setFilledSkeletons(skeletonSets);
    console.log("🎯 10 filled skeleton sets:", skeletonSets);
  }, [characters]);

  // Helper: role-based background color
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Healer":
        return { backgroundColor: "#ffe0f0", borderColor: "#ffa0c0" }; // pinkish
      case "Tank":
        return { backgroundColor: "#fff6c4", borderColor: "#ffd700" }; // yellow/gold
      case "DPS":
        return { backgroundColor: "#d8f3dc", borderColor: "#95d5b2" }; // greenish
      default:
        return { backgroundColor: "#f0f0f0", borderColor: "#ccc" };
    }
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        🧩 Reversed Solver — 多骨架生成展示 (10 套 × 6 组)
      </h3>

      {filledSkeletons.length === 0 ? (
        <p className={styles.empty}>暂无角色数据</p>
      ) : (
        filledSkeletons.map((sk) => (
          <div key={sk.index} className={styles.skeletonCard}>
            <div className={styles.skeletonHeader}>
              <strong>骨架组 #{sk.index + 1}</strong> — 共 {sk.groups.length} 组
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>组号</th>
                  <th>角色成员</th>
                </tr>
              </thead>
              <tbody>
                {sk.groups.map((g) => (
                  <tr key={g.index}>
                    <td>G{g.index + 1}</td>
                    <td>
                      {g.members.length === 0
                        ? "—"
                        : g.members.map((m, i) => (
                            <span
                              key={m._id}
                              className={styles.chip}
                              style={getRoleStyle(m.role)}
                            >
                              {m.name} {m.account}
                              {i < g.members.length - 1 ? "" : ""}
                            </span>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
