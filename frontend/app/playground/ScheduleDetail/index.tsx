"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runSolver, GroupResult, Character, AbilityCheck } from "@/utils/solver";
import GroupDetailModal from "../GroupDetailModal";

interface Schedule {
  _id: string;
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: AbilityCheck[];
  characterCount: number;
  characters: Character[];
}

interface Props {
  scheduleId: string;
}

export default function ScheduleDetail({ scheduleId }: Props) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

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

  const handleRunSolver = () => {
    if (!schedule) return;
    const results = runSolver(schedule.characters, schedule.checkedAbilities, 3);
    setGroups(results);
  };

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
          <ul className={styles.skillList}>
            {schedule.checkedAbilities.map((a, idx) => (
              <li
                key={idx}
                className={
                  a.available ? styles.available : styles.unavailable
                }
              >
                {a.name} (Lv{a.level}) {a.available ? "✅" : "❌ 未掉落"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.section}>
        <h3>角色信息</h3>
        <p>角色数量: {schedule.characterCount}</p>
      </div>

      <div className={styles.section}>
        <button className={styles.solverBtn} onClick={handleRunSolver}>
          运行排表器
        </button>

        {groups.length > 0 && (
          <div className={styles.groupsGrid}>
            {groups.map((g, idx) => (
              <div
                key={idx}
                className={styles.groupCard}
                onClick={() => setActiveIdx(idx)}
              >
                <h4 className={styles.groupTitle}>Group {idx + 1}</h4>
                <ul className={styles.memberList}>
                  {g.characters.map((c) => (
                    <li key={c._id} className={styles.memberItem}>
                      {c.name}
                    </li>
                  ))}
                </ul>
                {g.violations.length > 0 && (
                  <p className={styles.groupViolation}>
                    ⚠️ 违规: {g.violations.join("；")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeIdx !== null && (
        <GroupDetailModal
          groupIndex={activeIdx}
          group={groups[activeIdx]}
          checkedAbilities={schedule.checkedAbilities}
          conflictLevel={schedule.conflictLevel}
          onClose={() => setActiveIdx(null)}
        />
      )}
    </div>
  );
}
