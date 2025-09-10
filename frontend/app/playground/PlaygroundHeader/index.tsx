"use client";

import React from "react";
import styles from "./styles.module.css";

interface Props {
  onCreateSchedule: () => void;
}

export default function PlaygroundHeader({ onCreateSchedule }: Props) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>排表 Playground</h1>
      <button className={styles.button} onClick={onCreateSchedule}>
        新建排表
      </button>
    </div>
  );
}
