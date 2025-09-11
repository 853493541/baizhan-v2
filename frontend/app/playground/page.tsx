"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

interface Schedule {
  _id: string;
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: string;
  characterCount: number;
  groups: { index: number; characters: any[] }[];
}

export default function PlaygroundPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`
      );
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      console.error("❌ Error fetching schedules:", err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>排表 Playground</h2>

      <h3 className={styles.subtitle}>已有排表</h3>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => (
            <Link
              key={s._id}
              href={`/playground/${s._id}`}
              className={styles.card}
            >
              <h4 className={styles.cardTitle}>
                {new Date(s.createdAt).toLocaleString()}
              </h4>
              <p>服务器: {s.server}</p>
              <p>模式: {s.mode}</p>
              <p>冲突等级: {s.conflictLevel}</p>
              <p>角色数量: {s.characterCount}</p>
              <p>分组数量: {s.groups?.length || 0}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
