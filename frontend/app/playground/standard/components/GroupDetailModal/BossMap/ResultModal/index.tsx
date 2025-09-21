"use client";

import React from "react";
import styles from "./styles.module.css";

interface AssignedDrop {
  ability: string;
  char: string;
}

interface Props {
  group: any;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResultModal({ group, onClose, onConfirm }: Props) {
  if (!group) return null;

  // ✅ Build ID → Name lookup
  const idToName: Record<string, string> = {};
  group.characters?.forEach((c: any) => {
    idToName[c._id] = c.name;
  });

  // ✅ Gather all assigned drops (typed as AssignedDrop[])
  const assigned: AssignedDrop[] =
    group.kills
      ?.flatMap((k: any) =>
        k.selection?.ability && k.selection?.characterId
          ? [
              {
                ability: k.selection.ability,
                char: idToName[k.selection.characterId] || "",
              },
            ]
          : []
      ) || [];

  // ✅ Drop rate analysis
  const total = group.kills?.length || 0;
  const lv9 = group.kills?.filter((k: any) => k.dropLevel === 9 && k.completed).length || 0;
  const lv10 = group.kills?.filter((k: any) => k.dropLevel === 10 && k.completed).length || 0;
  const completed = group.kills?.filter((k: any) => k.completed).length || 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>掉落总结</h3>

        <h4>已分配掉落</h4>
        <ul>
          {assigned.length > 0 ? (
            assigned.map((a: AssignedDrop, i: number) => (
              <li key={i}>
                {a.ability} → {a.char}
              </li>
            ))
          ) : (
            <p>暂无分配</p>
          )}
        </ul>

        <h4>掉落率分析</h4>
        <p>
          Lv9: {lv9}/{total} ({((lv9 / (total || 1)) * 100).toFixed(1)}%)
        </p>
        <p>
          Lv10: {lv10}/{total} ({((lv10 / (total || 1)) * 100).toFixed(1)}%)
        </p>
        <p>
          总体: {completed}/{total} ({((completed / (total || 1)) * 100).toFixed(1)}%)
        </p>

        <div className={styles.actions}>
          <button onClick={onClose}>取消</button>
          <button onClick={onConfirm}>确认结束</button>
        </div>
      </div>
    </div>
  );
}
