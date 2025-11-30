"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";
import { Settings, X, Lock } from "lucide-react";
import styles from "./styles.module.css";
import { getGameWeekFromDate } from "@/utils/weekUtils";

interface Group {
  status?: "not_started" | "started" | "finished";
}

interface StandardSchedule {
  _id: string;
  name: string;
  server: string;
  conflictLevel?: number;
  createdAt: string;
  characterCount: number;
  groups?: Group[];
}

interface Props {
  schedules: StandardSchedule[];
  setSchedules: React.Dispatch<React.SetStateAction<StandardSchedule[]>>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function StandardScheduleList({ schedules, setSchedules }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // 🔥 Group by createdAt week (correct logic)
  const grouped = schedules.reduce(
    (acc: Record<string, StandardSchedule[]>, s) => {
      const rawWeek = getGameWeekFromDate(new Date(s.createdAt)); // "2025-W48"
      const weekNumber = rawWeek.split("-W")[1]; // "48"

      if (!acc[weekNumber]) acc[weekNumber] = [];
      acc[weekNumber].push(s);
      return acc;
    },
    {}
  );

  const weekList = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  // --- Rename ---
  const handleRename = async (id: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/standard-schedules/${id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Rename failed");

      const updated = await res.json();
      setSchedules((prev) =>
        prev.map((s) => (s._id === id ? { ...s, name: updated.name } : s))
      );
    } catch {
      alert("更新排表名字失败");
    }
  };

  // --- Delete ---
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/standard-schedules/${id}`, { method: "DELETE" });
      setSchedules((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("删除排表失败");
    }
  };

  return (
    <div>
      {weekList.map((week) => (
        <Fragment key={week}>
          {/* ❌ Week header removed */}

          <div className={styles.weekRow}>
            {grouped[week].map((s) => {
              const rawWeek = getGameWeekFromDate(new Date(s.createdAt)); // "2025-W48"
              const cardWeek = rawWeek.split("-W")[1]; // "48"

              const groups = s.groups || [];
              const finishedCount = groups.filter((g) => g.status === "finished").length;
              const totalGroups = groups.length;
              const locked = groups.some((g) => g.status !== "not_started");

              return (
                <div key={s._id} className={styles.cardWrapper}>
                  <Link
                    href={`/playground/standard/${s._id}`}
                    className={`${styles.card} ${styles.standard}`}
                  >
                    {/* --- Title Row --- */}
                    <div className={styles.cardHeader}>
                      <h4 className={styles.cardTitle}>{s.name}</h4>

                      <button
                        className={styles.gearBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingId(s._id);
                          setTempName(s.name);
                        }}
                      >
                        <Settings className={styles.gearIcon} />
                      </button>
                    </div>

                    {/* --- Content --- */}
                    <div className={styles.cardContent}>
                      {/* ❌ 时间 removed */}

                      <p>
                        <span className={styles.label}>角色数量:</span> {s.characterCount}
                      </p>

                      <p>
                        <span className={styles.label}>完成进度:</span>{" "}
                        {totalGroups ? `${finishedCount} / ${totalGroups}` : "N/A"}
                      </p>

                      <p>
                        <span className={styles.label}>状态:</span>{" "}
                        {locked ? "🔒 已锁定" : "🔓 未锁定"}
                      </p>

                      {/* 🔥 Bottom-right: W48 - 乾坤一掷 */}
                      <p className={styles.serverFooter}>
                        W{cardWeek} - {s.server}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <hr className={styles.weekDivider} />
        </Fragment>
      ))}

      {/* --- Modal --- */}
      {editingId && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => e.target === e.currentTarget && setEditingId(null)}
        >
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setEditingId(null)}>
              <X className={styles.closeIcon} />
            </button>

            <h3>编辑</h3>

            <label>
              编辑名字:
              <input
                ref={inputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </label>

            <div className={styles.modalActions}>
              {(() => {
                const schedule = schedules.find((s) => s._id === editingId);
                const locked = schedule?.groups?.some(
                  (g) => g.status !== "not_started"
                );

                return (
                  <button
                    className={`${styles.deleteBtn} ${locked ? styles.disabledBtn : ""}`}
                    disabled={locked}
                    onClick={() => {
                      if (!locked && confirm("⚠️ 确认删除？不可撤销")) {
                        handleDelete(editingId);
                        setEditingId(null);
                      }
                    }}
                  >
                    {locked ? (
                      <>
                        <Lock className={styles.lockIcon} /> 删除
                      </>
                    ) : (
                      "删除"
                    )}
                  </button>
                );
              })()}

              <button
                className={styles.saveBtn}
                onClick={() => {
                  handleRename(editingId!, tempName);
                  setEditingId(null);
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
