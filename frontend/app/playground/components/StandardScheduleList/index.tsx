"use client";

import { useState, useRef, useEffect, Fragment, useMemo } from "react";
import Link from "next/link";
import { Settings, X, Lock } from "lucide-react";
import styles from "./styles.module.css";
import { getGameWeekFromDate } from "@/utils/weekUtils";
import ConfirmModal from "@/app/components/ConfirmModal";
import { toastError } from "@/app/components/toast/toast";

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

/* ===============================
   Week helpers (FIX)
=============================== */
function parseWeek(week: string) {
  // "2026-W1" → { year: 2026, week: 1 }
  const m = week.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return null;
  return { year: Number(m[1]), week: Number(m[2]) };
}

function weekIndex(week: string) {
  const p = parseWeek(week);
  if (!p) return -1;
  return p.year * 100 + p.week; // ✅ YEAR-AWARE
}

export default function StandardScheduleList({
  schedules,
  setSchedules,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  /* ===============================
     ✅ FIXED GROUPING (YEAR SAFE)
  =============================== */
  const grouped = useMemo(() => {
    const acc: Record<
      string,
      { week: string; index: number; items: StandardSchedule[] }
    > = {};

    for (const s of schedules) {
      const fullWeek = getGameWeekFromDate(new Date(s.createdAt)); // "2026-W1"
      const idx = weekIndex(fullWeek);

      if (!acc[fullWeek]) {
        acc[fullWeek] = {
          week: fullWeek,
          index: idx,
          items: [],
        };
      }

      acc[fullWeek].items.push(s);
    }

    return acc;
  }, [schedules]);

  /* ===============================
     ✅ FIXED SORT (NO W53 BUG)
  =============================== */
  const weekList = useMemo(() => {
    return Object.values(grouped)
      .sort((a, b) => b.index - a.index)
      .map((g) => g.week);
  }, [grouped]);

  console.log(
    "[weekh] final week order:",
    weekList
  );

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
      toastError("更新排表名字失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/standard-schedules/${id}`, {
        method: "DELETE",
      });
      setSchedules((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toastError("删除排表失败");
    }
  };

  return (
    <div>
      {weekList.map((week) => (
        <Fragment key={week}>
          <div className={styles.weekRow}>
            {grouped[week].items.map((s) => {
              const rawWeek = getGameWeekFromDate(new Date(s.createdAt));
              const cardWeek = rawWeek.split("-W")[1];

              const groups = s.groups || [];
              const finishedCount = groups.filter(
                (g) => g.status === "finished"
              ).length;
              const totalGroups = groups.length;
              const locked = groups.some((g) => g.status !== "not_started");

              const progress = totalGroups
                ? (finishedCount / totalGroups) * 100
                : 0;

              return (
                <div key={s._id} className={styles.cardWrapper}>
                  <Link
                    href={`/playground/standard/${s._id}`}
                    className={`${styles.card} ${styles.standard}`}
                  >
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

                    <div className={styles.cardContent}>
                      <p>
                        <span className={styles.label}>角色数量:</span>{" "}
                        {s.characterCount}
                      </p>

                      <div className={styles.progressLine}>
                        <span className={styles.label}>完成进度:</span>

                        <div className={styles.progressInlineBar}>
                          <div
                            className={styles.progressInlineFill}
                            style={{
                              width: `${progress}%`,
                              backgroundColor:
                                progress === 100
                                  ? "#22c55e"
                                  : progress <= 30
                                  ? "#ef4444"
                                  : "#eab308",
                            }}
                          />
                        </div>

                        <span className={styles.progressText}>
                          {totalGroups
                            ? `${finishedCount} / ${totalGroups}`
                            : "N/A"}
                        </span>
                      </div>

                      <p>
                        <span className={styles.label}>状态:</span>{" "}
                        {locked ? "🔒 已锁定" : "🔓 未锁定"}
                      </p>

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

      {/* EDIT MODAL */}
      {editingId && (
        <div
          className={styles.modalOverlay}
          onClick={(e) =>
            e.target === e.currentTarget && setEditingId(null)
          }
        >
          <div className={styles.modal}>
            <button
              className={styles.closeBtn}
              onClick={() => setEditingId(null)}
            >
              <X className={styles.closeIcon} />
            </button>

            {/* <h3>编辑</h3> */}

            <label>
              编辑排表名称：
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
                    className={`${styles.deleteBtn} ${
                      locked ? styles.disabledBtn : ""
                    }`}
                    disabled={locked}
                    onClick={() => {
                      if (!locked) setConfirmDeleteId(editingId);
                    }}
                  >
                    <Lock className={styles.lockIcon} />
                    {locked ? "已锁定" : "删除排表"}
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

      {confirmDeleteId && (
        <ConfirmModal
          intent="danger"
          title="确认删除"
          message="确认删除？此操作不可撤销"
          confirmText="删除"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            handleDelete(confirmDeleteId);
            setConfirmDeleteId(null);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
