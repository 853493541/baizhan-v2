"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, X, Trash2, Lock, Plus } from "lucide-react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";
import { toastError } from "@/app/components/toast/toast";

interface Props {
  schedule: {
    _id?: string;
    name: string;
    server: string;
    characterCount: number;
    createdAt: string;
  };
  onBack: () => void;
  onDelete?: () => void;
  onOpenEditCharacters: () => void;
  locked?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function ScheduleHeader({
  schedule,
  onBack,
  onDelete,
  onOpenEditCharacters,
  locked = false,
}: Props) {
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const [open, setOpen] = useState(false);
  const [tempName, setTempName] = useState(schedule.name);

  const [showQuickConfirm, setShowQuickConfirm] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSchedule(schedule);
    setTempName(schedule.name);
  }, [schedule]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  const handleRename = async () => {
    if (!localSchedule._id) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/standard-schedules/${localSchedule._id}/name`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: tempName }),
        }
      );

      if (!res.ok) throw new Error("Failed");

      setLocalSchedule((p) => ({ ...p, name: tempName }));
      setOpen(false);
    } catch {
      toastError("更新失败，请稍后再试");
    }
  };

  /* ================= DELETE ================= */

  const handleDeleteClick = () => {
    if (locked) setConfirmingDelete(true);
    else setShowQuickConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteInput.trim() === "确认删除") {
      onDelete?.();
      setConfirmingDelete(false);
      setDeleteInput("");
      setOpen(false);
    } else {
      toastError("请输入正确的确认文字：确认删除");
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(false);
    setDeleteInput("");
  };

  const isInvalidCount =
    localSchedule.characterCount % 3 !== 0 &&
    localSchedule.characterCount !== 0;

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className={styles.headerBar}>
        {/* Row 1: Back */}
        {/* <button className={styles.backBtn} onClick={onBack}>
          ← 返回
        </button> */}

        {/* Row 2: Title + Actions */}
        <div className={styles.titleRow}>
          <div className={styles.headerTitle}>
            排表详情 · {localSchedule.name || "未命名排表"}
          </div>

          <div className={styles.titleActions}>
            <button
              className={styles.iconBtn}
              onClick={() => setOpen(true)}
              title="排表设置"
            >
              <Settings size={18} />
            </button>

            <div className={styles.editWrapper}>
              <button
                className={styles.iconBtnPrimary}
                onClick={onOpenEditCharacters}
                title="编辑参与角色"
              >
                <Plus size={18} />
              </button>

              {isInvalidCount && (
                <span className={styles.countWarning}>
                  排表人数错误！（{localSchedule.characterCount}）
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SETTINGS MODAL ================= */}
      {open && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className={styles.modal}>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>

            <h3>排表设置</h3>

            <label>
              排表名称
              <input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </label>

            <div className={styles.readonlyRow}>
              <span>服务器</span>
              <span>{localSchedule.server}</span>
            </div>

            <div className={styles.readonlyRow}>
              <span>角色数量</span>
              <span>{localSchedule.characterCount}</span>
            </div>

            <div className={styles.readonlyRow}>
              <span>创建时间</span>
              <span>
                {new Date(localSchedule.createdAt).toLocaleString()}
              </span>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.deleteBtn}
                onClick={handleDeleteClick}
              >
                {locked ? <Lock size={14} /> : <Trash2 size={14} />}
                删除
              </button>

              <button className={styles.saveBtn} onClick={handleRename}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOCKED DELETE ================= */}
      {confirmingDelete && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelDelete();
          }}
        >
          <div className={styles.modal}>
            <button
              className={styles.closeBtn}
              onClick={handleCancelDelete}
            >
              <X size={20} />
            </button>

            <h3>确认删除</h3>

            <p className={styles.warningText}>
              该排表已开始，是否确认删除？
              <br />
              请输入 <strong>确认删除</strong>
            </p>

            <input
              className={styles.confirmInput}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />

            <div className={styles.modalActions}>
              <button
                className={styles.deleteBtn}
                onClick={handleConfirmDelete}
              >
                确认删除
              </button>

              <button
                className={styles.cancelBtn}
                onClick={handleCancelDelete}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK DELETE ================= */}
      {showQuickConfirm && (
        <ConfirmModal
          title="确认删除"
          message="确定要删除这个排表吗？此操作不可撤销。"
          confirmText="删除"
          onCancel={() => setShowQuickConfirm(false)}
          onConfirm={() => {
            onDelete?.();
            setShowQuickConfirm(false);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
