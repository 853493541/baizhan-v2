"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import Drawer from "../Drawer";
import styles from "./styles.module.css";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ username comes from AuthGate via window (set once)
  const [username] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return (window as any).__AUTH_USERNAME__ ?? null;
  });

  /* =====================================================
     🧭 DRAWER LOGIC
     ===================================================== */
  const toggleDrawer = () => {
    setDrawerOpen((prev) => {
      const next = !prev;
      document.body.classList.toggle("drawer-open", next);
      return next;
    });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    document.body.classList.remove("drawer-open");
  };

  /* =====================================================
     🚫 LOGIN PAGE — NO LAYOUT
     ===================================================== */
  if (isLoginPage) {
    return <>{children}</>;
  }

  /* =====================================================
     ✅ NORMAL APP LAYOUT
     ===================================================== */
  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topbarGlobal}>
        <TopBar onMenuClick={toggleDrawer} username={username} />
      </div>

      {/* Main grid */}
      <div className={styles.appGrid}>
        <aside className={styles.sidebar}>
          <Sidebar />
        </aside>

        <main className={styles.main}>{children}</main>
      </div>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <Sidebar />
      </Drawer>
    </div>
  );
}
