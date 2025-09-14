"use client";

import Link from "next/link";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface StandardSchedule {
  _id: string;
  name: string; // ✅ new
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: Ability[];
  characterCount: number;
}

interface Props {
  schedules: StandardSchedule[];
}

export default function StandardScheduleList({ schedules }: Props) {
  return (
    <div>
      <h3 className={styles.subtitle}>已有排表</h3>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => (
            <Link
              key={s._id}
              href={`/playground/standard/${s._id}`}
              className={styles.card}
            >
              <h4 className={styles.cardTitle}>{s.name || "未命名排表"}</h4>
              <p>服务器: {s.server}</p>
              <p>冲突等级: {s.conflictLevel}</p>
              <p>角色数量: {s.characterCount}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
