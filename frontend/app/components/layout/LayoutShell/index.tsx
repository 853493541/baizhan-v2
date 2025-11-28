"use client";

import React, { useState } from "react";
import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import Drawer from "../Drawer";
import styles from "./styles.module.css";

export default function LayoutShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(prev => {
      const next = !prev;
      if (next) document.body.classList.add("drawer-open");
      else document.body.classList.remove("drawer-open");
      return next;
    });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    document.body.classList.remove("drawer-open");
  };

  return (
    <div className={styles.container}>

      {/* ⭐ Global Top Bar (NOT inside grid anymore!) */}
      <div className={styles.topbarGlobal}>
        <TopBar onMenuClick={toggleDrawer} />
      </div>

      {/* ⭐ Grid layout BELOW the top bar */}
      <div className={styles.appGrid}>
        <aside className={styles.sidebar}>
          <Sidebar />
        </aside>

        <main className={styles.main}>{children}</main>
      </div>

      {/* ⭐ Mobile drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <Sidebar />
      </Drawer>
    </div>
  );
}
