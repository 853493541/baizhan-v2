"use client";

import Link from "next/link";
import styles from "./styles.module.css";

interface BossPlan {
  _id: string;
  server: string;
  groupSize?: number;
  boss?: string;
  createdAt: string;
}

interface Props {
  bossPlans: BossPlan[];
}

export default function BossScheduleList({ bossPlans }: Props) {
  return (
    <div>
      <h3 className={styles.subtitle}>已有 Boss 排表</h3>
      {bossPlans.length === 0 ? (
        <p className={styles.empty}>暂无 Boss 排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {bossPlans.map((bp) => (
            <Link
              key={bp._id}
              href={`/playground/boss/${bp._id}`}
              className={styles.card}
            >
              <h4 className={styles.cardTitle}>
                {new Date(bp.createdAt).toLocaleString()}
              </h4>
              <p>服务器: {bp.server}</p>
              <p>分组人数: {bp.groupSize}</p>
              <p>Boss: {bp.boss}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
