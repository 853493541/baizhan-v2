"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, X, Lock } from "lucide-react";
import styles from "./styles.module.css";

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

  // ✅ Auto-focus on modal open
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // ✅ Rename schedule
  const handleRename = async (id: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/standard-schedules/${id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      const updated = await res.json();

      setSchedules((prev) =>
        prev.map((s) => (s._id === id ? { ...s, name: updated.name } : s))
      );
    } catch (err) {
      alert("更新排表名字失败");
    }
  };

  // ✅ Delete schedule (disabled if locked)
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/standard-schedules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete schedule");
      setSchedules((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert("删除排表失败");
    }
  };

  return (
    <div>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => {
            const groups = s.groups || [];
            const finishedCount = groups.filter((g) => g.status === "finished").length;
            const totalGroups = groups.length;
            const locked = groups.some(
              (g) => g.status === "started" || g.status === "finished"
            );

            return (
              <div key={s._id} className={styles.cardWrapper}>
                {/* clickable card */}
                <Link
                  href={`/playground/standard/${s._id}`}
                  className={`${styles.card} ${styles.standard}`}
                >
                  <h4 className={styles.cardTitle}>{s.name}</h4>
                  <div className={styles.cardContent}>
                    <p>
                      <span className={styles.label}>服务器:</span> {s.server}
                    </p>
                    <p>
                      <span className={styles.label}>角色数量:</span>{" "}
                      {s.characterCount ?? "N/A"}
                    </p>
                    <p>
                      <span className={styles.label}>完成进度:</span>{" "}
                      {totalGroups > 0
                        ? `${finishedCount} / ${totalGroups}`
                        : "N/A"}
                    </p>
                    <p>
                      <span className={styles.label}>锁定状态:</span>{" "}
                      {locked ? "🔒 已锁定" : "🔓 未锁定"}
                    </p>
                  </div>
                  <p className={styles.date}>
                    创建时间: {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </Link>

                {/* Gear icon for edit/delete */}
                <button
                  className={styles.gearBtn}
                  onClick={() => {
                    setEditingId(s._id);
                    setTempName(s.name);
                  }}
                >
                  <Settings size={22} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔹 Modal for rename/delete */}
      {editingId && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingId(null);
          }}
        >
          <div className={styles.modal}>
            <button
              className={styles.closeBtn}
              onClick={() => setEditingId(null)}
            >
              <X size={20} />
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
                const groups = schedule?.groups || [];
                const locked = groups.some(
                  (g) => g.status === "started" || g.status === "finished"
                );

                return (
                  <button
                    className={`${styles.deleteBtn} ${
                      locked ? styles.disabledBtn : ""
                    }`}
                    disabled={locked}
                    onClick={() => {
                      if (!locked) {
                        if (
                          window.confirm("⚠️ 确认要删除这个排表吗？此操作不可撤销")
                        ) {
                          handleDelete(editingId);
                          setEditingId(null);
                        }
                      }
                    }}
                  >
                    {locked ? (
                      <>
                        <Lock size={14} style={{ marginRight: 4 }} />
                        删除
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
                  handleRename(editingId, tempName);
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
