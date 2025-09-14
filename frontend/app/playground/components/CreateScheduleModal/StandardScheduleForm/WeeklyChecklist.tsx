"use client";

import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Props {
  checklist: Ability[];
  loading: boolean;
}

export default function WeeklyChecklist({ checklist, loading }: Props) {
  return (
    <div className={styles.previewBox}>
      <h4>默认模式检查技能</h4>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {checklist.map((a, idx) => (
            <li
              key={idx}
              style={{ color: a.available ? "black" : "gray" }}
            >
              {a.name} (Lv{a.level}) {!a.available && "❌ 未掉落"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
