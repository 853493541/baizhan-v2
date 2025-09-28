import React from "react";
import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import styles from "./styles.module.css";

export default function LayoutShell({ children, sidebar }: { 
  children: React.ReactNode; 
  sidebar?: React.ReactNode; 
}) {
  return (
    <div className={styles.appGrid}>
      {/* Global nav on top */}
      <div className={styles.topbar}>
        <TopBar />
      </div>

      {/* Local nav on the left */}
      <aside className={styles.sidebar}>
        <Sidebar>{sidebar}</Sidebar>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
