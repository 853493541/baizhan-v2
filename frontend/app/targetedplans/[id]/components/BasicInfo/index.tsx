"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, X, Trash2, Lock } from "lucide-react";
import styles from "./styles.module.css";
import {
  toastError,
  toastSuccess,
  toastInfo,
} from "@/app/components/toast/toast";

interface Props {
  schedule: {
    _id?: string;
    planId?: string;
    name: string;
    server: string;
    characterCount: number;
    createdAt: string;
  };
  onBack: () => void;
  onDelete?: () => void;
  locked?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function BasicInfoSection({
  schedule,
  onBack,
  onDelete,
  locked = false,
}: Props) {
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(schedule.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSchedule(schedule);
    setTempName(schedule.name);
  }, [schedule]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const getPlanIdentifier = () =>
    localSchedule.planId || localSchedule._id || "";

  /* ✏️ Rename targeted plan */
  const handleRename = async () => {
    const id = getPlanIdentifier();
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tempName }),
      });
      if (!res.ok) throw new Error("Failed to update name");

      setLocalSchedule((prev) => ({ ...prev, name: tempName }));
      setEditing(false);
    } catch (err) {
      console.error("❌ Rename failed:", err);
      toastError("更新失败，请稍后再试");

    }
  };

  /* 🗑️ Handle delete click */
  const handleDeleteClick = () => {
    if (locked) {
      setConfirmingDelete(true);
    } else {
      if (confirm("确定要删除这个排表吗？")) {
        handleDirectDelete();
      }
    }
  };

  /* 🧹 Direct delete for unlocked plans (tolerant to 404) */
  const handleDirectDelete = async () => {
    const id = getPlanIdentifier();
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/targeted-plans/${id}`, {
        method: "DELETE",
      });
      // ✅ Ignore 404 since it just means "already deleted"
      if (res.status !== 200 && res.status !== 201 && res.status !== 204) {
        if (res.status !== 404) throw new Error("Delete failed");
      }
      onDelete?.();
      setEditing(false);
    } catch (err) {
      console.error("❌ Delete failed:", err);
      toastError("删除失败，请稍后再试");
    }
  };

  /* 🔒 Confirm delete for locked plans (tolerant to 404) */
  const handleConfirmDelete = async () => {
    const id = getPlanIdentifier();
    if (!id) return;

    if (deleteInput.trim() === "确认删除") {
      try {
        const res = await fetch(`${API_BASE}/api/targeted-plans/${id}`, {
          method: "DELETE",
        });
        if (res.status !== 200 && res.status !== 201 && res.status !== 204) {
          if (res.status !== 404) throw new Error("Delete failed");
        }
        onDelete?.();
      } catch (err) {
        console.error("❌ Confirmed delete failed:", err);
        toastError("删除失败，请稍后再试");
      } finally {
        setConfirmingDelete(false);
        setEditing(false);
      }
    } else {
      toastError("请输入正确的确认文字：确认删除");
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(false);
    setEditing(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          ← 返回
        </button>
        <h2 className={styles.title}>排表详情</h2>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>基本信息</h3>
          <button className={styles.gearBtn} onClick={() => setEditing(true)}>
            <Settings size={18} />
          </button>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>排表名称:</span>
          <span className={styles.value}>
            {localSchedule.name || "未命名排表"}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>服务器:</span>
          <span className={styles.value}>{localSchedule.server}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>角色数量:</span>
          <span className={styles.value}>{localSchedule.characterCount}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>创建时间:</span>
          <span className={styles.value}>
            {new Date(localSchedule.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ✏️ Editing Modal */}
      {editing && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(false);
          }}
        >
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setEditing(false)}>
              <X size={20} />
            </button>

            <h3>编辑排表</h3>
            <label>
              排表名称:
              <input
                ref={inputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </label>

            <div className={styles.modalActions}>
              <button className={styles.deleteBtn} onClick={handleDeleteClick}>
                {locked ? (
                  <>
                    <Lock size={14} style={{ marginRight: 4 }} />
                    删除
                  </>
                ) : (
                  <>
                    <Trash2 size={14} style={{ marginRight: 4 }} />
                    删除
                  </>
                )}
              </button>
              <button className={styles.saveBtn} onClick={handleRename}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 Delete Confirmation Modal */}
      {confirmingDelete && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelDelete();
          }}
        >
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={handleCancelDelete}>
              <X size={20} />
            </button>
            <h3>确认删除</h3>
            <p className={styles.warningText}>
              该排表已开始，是否确认删除？
              <br />
              请在下方输入 <strong>确认删除</strong> 以继续。
            </p>

            <input
              className={styles.confirmInput}
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="请输入 确认删除"
            />

            <div className={styles.modalActions}>
              <button className={styles.deleteBtn} onClick={handleConfirmDelete}>
                确认删除
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelDelete}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
