"use client";

import styles from "./styles.module.css";

interface Props {
  schedule: {
    name: string;
    server: string;
    conflictLevel: number;
    characterCount: number;
    createdAt: string;
  };
  onBack: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export default function BasicInfoSection({
  schedule,
  onBack,
  onDelete,
  deleting,
}: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{schedule.name || "未命名排表"}</h2>
        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onBack}>
            ← 返回
          </button>
          <button
            className={styles.deleteBtn}
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "删除中..." : "🗑 删除"}
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <p>
          <strong>服务器:</strong> {schedule.server}
        </p>
        <p>
          <strong>角色数量:</strong> {schedule.characterCount}
        </p>
        <p>
          <strong>冲突等级:</strong> {schedule.conflictLevel}
        </p>
        <p>
        </p>
      </div>
    </div>
  );
}
