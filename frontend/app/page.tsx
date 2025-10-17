"use client";

import React from "react";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>百战</h1>
      <p className={styles.subtitle}>快速查看角色和排表</p>

      <div className={styles.footer}>
        <p>版本 v2.01</p>
        <p>作者: 轻语@乾坤一掷</p>
      </div>
    </div>
  );
}
