"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, X, Lock } from "lucide-react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal"; // ✅ added

interface Group {
  status?: "not_started" | "started" | "finished";
}

interface TargetedPlan {
  _id: string;
  planId: string;
  name: string;
  server: string;
  targetedBoss: string;
  createdAt: string;
  characterCount: number;
  groups?: Group[];
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

  // ✅ ConfirmModal state (ONLY for delete confirm)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // ✅ Debug: log every plan object received
  useEffect(() => {
    console.group("📦 [Debug] Targeted Plan Objects Received");
    console.log("Total plans:", schedules.length);
    schedules.forEach((p, i) => {
      console.log(`Plan #${i + 1}:`, JSON.parse(JSON.stringify(p)));
    });
    console.groupEnd();
  }, [schedules]);

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
      console.error("❌ 更新单体计划名字失败:", err);
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
      console.error("❌ 删除单体计划失败:", err);
      alert("删除单体计划失败");
    }
  };

  return (
    <>
      <div>
        {schedules.length === 0 ? (
          <p className={styles.empty}>暂无单体计划</p>
        ) : (
          <div className={styles.cardGrid}>
            {schedules.map((p) => {
              const groups = p.groups || [];
              const finishedCount = groups.filter(
                (g) => g.status === "finished"
              ).length;
              const totalGroups = groups.length;
              const locked = groups.some(
                (g) => g.status === "started" || g.status === "finished"
              );

              return (
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
                        <span className={styles.label}>角色数量:</span>{" "}
                        {p.characterCount ?? "N/A"}
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

                    {/* 👇 bottom-right corner: server · boss (italic) */}
                    <p className={styles.footerLine}>
                      {p.server} · {p.targetedBoss}
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
                {(() => {
                  const plan = schedules.find((p) => p.planId === editingId);
                  const groups = plan?.groups || [];

                  // ✅ Exact same lock logic as display
                  const locked = groups.some(
                    (g) => g.status === "started" || g.status === "finished"
                  );

                  return (
                    <button
                      className={`${styles.deleteBtn} ${
                        locked || disabled ? styles.disabledBtn : ""
                      }`}
                      disabled={locked || disabled}
                      onClick={() => {
                        if (!locked && !disabled) {
                          // ✅ ONLY change: open our ConfirmModal instead of window.confirm
                          setPendingDeleteId(editingId);
                          setConfirmOpen(true);
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

      {/* ✅ Custom ConfirmModal (ONLY for delete confirm) */}
      {confirmOpen && pendingDeleteId && (
        <ConfirmModal
          title="删除对单排表"
          message="确认要删除这个对单排表？"
          intent="danger"
          confirmText="删除"
          onCancel={() => {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }}
          onConfirm={async () => {
            const id = pendingDeleteId;
            setConfirmOpen(false);
            setPendingDeleteId(null);

            await handleDelete(id);
            setEditingId(null);
          }}
        />
      )}
    </>
  );
}
