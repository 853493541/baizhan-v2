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
    <div
      className={styles.overlay}
      onClick={onCancel} // 👈 click outside to close
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // 👈 prevent close when clicking inside
      >
        <div className={`${styles.header} ${styles[intent]}`}>
          <span>{title}</span>
          <button
            className={styles.close}
            onClick={onCancel}
            aria-label="close"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={`${styles.icon} ${styles[intent]}`}>⚠️</div>
          <p>{message}</p>
        </div>

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
