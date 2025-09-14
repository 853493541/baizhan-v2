"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { runSolver, GroupResult, Character, AbilityCheck } from "@/utils/solver";
import GroupDetailModal from "../GroupDetailModal";
import { useRouter } from "next/navigation";

interface StandardSchedule {
  _id: string;
  name: string; // ✅ new
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: AbilityCheck[];
  characterCount: number;
  characters: Character[];
  groups?: { index: number; characters: Character[] }[];
}

interface Props {
  scheduleId: string;
}

// ✅ QA checker (frontend only)
function checkGroupQA(
  group: GroupResult,
  conflictLevel: number,
  checkedAbilities: AbilityCheck[]
): string[] {
  const warnings: string[] = [];

  if (!group.characters.some((c) => c.role === "Healer")) {
    warnings.push("缺少治疗");
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of group.characters) {
    if (seen.has(c.account)) dups.add(c.account);
    seen.add(c.account);
  }
  if (dups.size > 0) {
    warnings.push(`重复账号: ${Array.from(dups).join("、")}`);
  }

  const activeAbilities = checkedAbilities.filter((a) => a.available);
  const abilityCount: Record<string, number> = {};
  for (const c of group.characters) {
    for (const a of activeAbilities) {
      const lvl = c.abilities?.[a.name] ?? 0;
      if (lvl >= conflictLevel) {
        abilityCount[a.name] = (abilityCount[a.name] ?? 0) + 1;
      }
    }
  }

  for (const [ability, count] of Object.entries(abilityCount)) {
    if (count > 2) {
      warnings.push(`${ability} ${count}/2`);
    }
  }

  return warnings;
}

export default function ScheduleDetail({ scheduleId }: Props) {
  const [schedule, setSchedule] = useState<StandardSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  // ✅ Fetch schedule + groups on load
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`
        );
        if (!res.ok) throw new Error("Failed to fetch schedule");
        const data = await res.json();
        setSchedule(data);

        if (data.groups) {
          console.log("📥 Loaded groups from DB:", data.groups);
          setGroups(data.groups);
        }
      } catch (err) {
        console.error("❌ Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [scheduleId]);

  // ✅ Run solver + auto-submit
  const handleRunSolver = async () => {
    if (!schedule) return;
    const results = runSolver(
      schedule.characters,
      schedule.checkedAbilities,
      3
    );
    console.log("🧩 Solver results:", results);
    setGroups(results);

    const payload = results.map((g, idx) => ({
      index: idx + 1,
      characters: g.characters.map((c) => c._id),
    }));

    try {
      setSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${schedule._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups: payload }),
        }
      );

      if (!res.ok) throw new Error("Failed to update groups");
      await res.json();
    } catch (err) {
      console.error("❌ Error saving groups:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个排表吗？")) return;
    try {
      setDeleting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${scheduleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      router.push("/playground");
    } catch (err) {
      console.error("❌ Failed to delete schedule:", err);
      setDeleting(false);
    }
  };

  if (loading) return <p className={styles.loading}>加载中...</p>;
  if (!schedule) return <p className={styles.error}>未找到排表</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {schedule.name || "未命名排表"} {/* ✅ show name */}
        </h2>
        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={() => router.push("/playground")}>
            ← 返回
          </button>
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "删除中..." : "🗑 删除"}
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <p><strong>模式:</strong> {schedule.mode}</p>
        <p><strong>冲突等级:</strong> {schedule.conflictLevel}</p>
        <p><strong>服务器:</strong> {schedule.server}</p>
        <p><strong>创建时间:</strong> {new Date(schedule.createdAt).toLocaleString()}</p>
      </div>

      {schedule.mode === "default" && (
        <div className={styles.section}>
          <h3>检查技能</h3>
          <ul className={styles.skillList}>
            {schedule.checkedAbilities.map((a, idx) => (
              <li
                key={idx}
                className={a.available ? styles.available : styles.unavailable}
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
          运行排表器并保存
        </button>

        {groups.length > 0 && (
          <div className={styles.groupsGrid}>
            {groups.map((g, idx) => {
              const qaWarnings = checkGroupQA(
                g,
                schedule.conflictLevel,
                schedule.checkedAbilities
              );
              return (
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
                  {qaWarnings.length > 0 && (
                    <div className={styles.groupViolation}>
                      {qaWarnings.map((w, i) => (
                        <p key={i}>⚠️ {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
