import React from "react";
import styles from "./styles.module.css";

/**
 * Sidebar is now for local navigation only.
 * Each page can decide what local nav/filters to render here.
 */
export default function Sidebar({ children }: { children?: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.localNav}>
        {children || <span className={styles.placeholder}>本页无局部导航</span>}
      </div>
    </div>
  );
}
