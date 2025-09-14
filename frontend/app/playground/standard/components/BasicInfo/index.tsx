"use client";

import styles from "./styles.module.css";

interface Props {
  schedule: {
    name: string;
    server: string;
    conflictLevel: number;
    characterCount: number;
    createdAt: string;
    mode: string;
  };
}

export default function BasicInfoSection({ schedule }: Props) {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{schedule.name || "未命名排表"}</h2>
      <p><strong>{schedule.server}</strong></p>
      <p><strong>角色数量:</strong> {schedule.characterCount}</p>
      <p><strong>冲突等级:</strong> {schedule.conflictLevel}</p>
      
    </div>
  );
}
