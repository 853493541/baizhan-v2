import React from "react";
import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import styles from "./styles.module.css";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.appGrid}>
      <div className={styles.topbar}><TopBar /></div>
      <aside className={styles.sidebar}><Sidebar /></aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
