"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Character {
  _id: string;
  name: string;
  account: string;
  role: string;
}

interface Schedule {
  _id: string;
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: Ability[];
  characterCount: number;
  characters: Character[];
}

interface Props {
  scheduleId: string;
}

export default function ScheduleDetail({ scheduleId }: Props) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${scheduleId}`
        );
        if (!res.ok) throw new Error("Failed to fetch schedule");
        const data = await res.json();
        setSchedule(data);
      } catch (err) {
        console.error("❌ Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  if (loading) return <p>加载中...</p>;
  if (!schedule) return <p>未找到排表</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>排表详情</h2>

      <div className={styles.info}>
        <p>
          <strong>模式:</strong> {schedule.mode}
        </p>
        <p>
          <strong>冲突等级:</strong> {schedule.conflictLevel}
        </p>
        <p>
          <strong>服务器:</strong> {schedule.server}
        </p>
        <p>
          <strong>创建时间:</strong>{" "}
          {new Date(schedule.createdAt).toLocaleString()}
        </p>
      </div>

      {schedule.mode === "default" && (
        <div className={styles.section}>
          <h3>检查技能</h3>
          <ul>
            {schedule.checkedAbilities.map((a, idx) => (
              <li
                key={idx}
                className={a.available ? styles.available : styles.unavailable}
              >
                {a.name} (Lv{a.level}){" "}
                {!a.available && <span>❌ 未掉落</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.section}>
        <h3>角色信息</h3>
        <p>角色数量: {schedule.characterCount}</p>
        <ul>
          {schedule.characters.map((c) => (
            <li key={c._id}>
              {c.name} ｜ {c.role} ｜ {c.account}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
