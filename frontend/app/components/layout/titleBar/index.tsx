"use client";

import React from "react";
import styles from "./styles.module.css";

interface TitleBarProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
}

export default function TitleBar({ title, subtitle, badge }: TitleBarProps) {
  return (
    <div className={styles.titleBar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
