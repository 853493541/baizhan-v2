"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, X } from "lucide-react";
import styles from "./styles.module.css";

interface TargetedPlan {
  _id: string;
  planId: string;
  name: string;
  server: string;
  targetedBoss: string;
  createdAt: string;
  characterCount: number;
}

interface Props {
  schedules: TargetedPlan[];
  setSchedules: React.Dispatch<React.SetStateAction<TargetedPlan[]>>;
  disabled?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function StandardScheduleList({
  schedules,
  setSchedules,
  disabled,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Auto-focus when renaming
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // ✅ Rename targeted plan
  const handleRename = async (planId: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      const updated = await res.json();

      setSchedules((prev) =>
        prev.map((p) => (p.planId === planId ? { ...p, name: updated.name } : p))
      );
    } catch (err) {
      alert("更新单体计划名字失败");
    }
  };

  // ✅ Delete targeted plan
  const handleDelete = async (planId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete plan");
      setSchedules((prev) => prev.filter((p) => p.planId !== planId));
    } catch (err) {
      alert("删除单体计划失败");
    }
  };

  return (
    <div>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无单体计划</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((p) => (
            <div key={p.planId} className={styles.cardWrapper}>
              {/* clickable card */}
              <Link
                href={`/targetedplans/${p.planId}`}
                className={`${styles.card} ${styles.standard} ${
                  disabled ? styles.disabledCard : ""
                }`}
              >
                <h4 className={styles.cardTitle}>{p.name}</h4>
                <div className={styles.cardContent}>
                  <p>
                    <span className={styles.label}>服务器:</span> {p.server}
                  </p>
                  <p>
                    <span className={styles.label}>目标 Boss:</span>{" "}
                    {p.targetedBoss || "未知"}
                  </p>
                  <p>
                    <span className={styles.label}>角色数量:</span>{" "}
                    {p.characterCount ?? "N/A"}
                  </p>
                </div>
                <p className={styles.date}>
                  创建时间: {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </Link>

              {/* Gear icon for edit/delete */}
              <button
                className={styles.gearBtn}
                onClick={() => {
                  setEditingId(p.planId);
                  setTempName(p.name);
                }}
              >
                <Settings size={22} />
              </button>
            </div>
          ))}
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

            <h3>编辑单体计划</h3>
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
              <button
                className={`${styles.deleteBtn} ${
                  disabled ? styles.disabledBtn : ""
                }`}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    if (
                      window.confirm("⚠️ 确认要删除这个单体计划吗？此操作不可撤销")
                    ) {
                      handleDelete(editingId);
                      setEditingId(null);
                    }
                  }
                }}
              >
                删除
              </button>

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
