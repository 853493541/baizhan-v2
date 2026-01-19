"use client";
import React from "react";
import styles from "./styles.module.css";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  intent?: "danger" | "warning" | "neutral" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  intent = "neutral",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.modal} ${styles[intent]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button
            className={styles.close}
            onClick={onCancel}
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* ================= Body ================= */}
        <div className={styles.body}>
          <div className={`${styles.icon} ${styles[intent]}`}>
            {intent === "danger" && "✖"}
            {intent === "warning" && "!"}
            {intent === "success" && "✔"}
            {intent === "neutral" && "?"}
          </div>

          <p>{message}</p>
        </div>

        {/* ================= Footer ================= */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>

          <button
            className={`${styles.confirmBtn} ${styles[intent]}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
