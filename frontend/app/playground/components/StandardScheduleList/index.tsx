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
  name: string;
  server: string;
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
      <h3 className={styles.subtitle}>已有标准排表</h3>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => (
            <Link
              key={s._id}
              href={`/playground/standard/${s._id}`}
              className={`${styles.card} ${styles.standard}`}
            >
              <h4 className={styles.cardTitle}>{s.name}</h4>
              <div className={styles.cardContent}>
                <p>
                  <span className={styles.label}>服务器:</span> {s.server}
                </p>
                <p>
                  <span className={styles.label}>冲突等级:</span>{" "}
                  {s.conflictLevel}
                </p>
                <p>
                  <span className={styles.label}>角色数量:</span>{" "}
                  {s.characterCount}
                </p>
              </div>
              <p className={styles.date}>
                创建时间: {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
