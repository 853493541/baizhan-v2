"use client";

import Image from "next/image";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Props {
  checklist: Ability[];
  loading: boolean;
  conflictLevel: number;
}

export default function WeeklyChecklist({
  checklist,
  loading,
  conflictLevel,
}: Props) {
  // ✅ sort: available first, then unavailable
  const sortedChecklist = [...checklist].sort((a, b) => {
    if (a.available === b.available) return 0;
    return a.available ? -1 : 1;
  });

  return (
    <div className={styles.previewBox}>
      <h4 className={styles.header}>本周 {conflictLevel} 级技能</h4>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <ul className={styles.list}>
          {sortedChecklist.map((a, idx) => (
            <li
              key={idx}
              className={`${styles.item} ${
                a.available ? styles.available : styles.unavailable
              }`}
            >
              <Image
                src={`/icons/${a.name}.png`}
                alt={a.name}
                width={24}
                height={24}
                className={styles.icon}
              />
              <span className={styles.text}>
                {a.name} 
              </span>
              {!a.available && (
                <span className={styles.missing}>❌ 未掉落</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
