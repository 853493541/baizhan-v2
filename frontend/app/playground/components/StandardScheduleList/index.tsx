"use client";

import Link from "next/link";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Group {
  status?: "not_started" | "started" | "finished";
}

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: Ability[];
  characterCount: number;
  groups?: Group[];   // 👈 added groups
}

interface Props {
  schedules: StandardSchedule[];
}

export default function StandardScheduleList({ schedules }: Props) {
  return (
    <div>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => {
            const finishedCount =
              s.groups?.filter((g) => g.status === "finished").length ?? 0;
            const totalGroups = s.groups?.length ?? 0;
            const locked =
              s.groups?.some(
                (g) => g.status === "started" || g.status === "finished"
              ) ?? false;

            return (
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
                  {totalGroups > 0 && (
                    <p>
                      <span className={styles.label}>完成进度:</span>{" "}
                      {finishedCount} / {totalGroups}
                    </p>
                  )}
                  <p>
                    <span className={styles.label}>锁定状态:</span>{" "}
                    {locked ? "🔒 已锁定" : "🔓 未锁定"}
                  </p>
                </div>
                <p className={styles.date}>
                  创建时间: {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
