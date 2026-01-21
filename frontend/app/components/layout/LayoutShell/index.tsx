"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import Drawer from "../Drawer";
import styles from "./styles.module.css";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = pathname === "/login";

  /* =====================================================
     🔐 GLOBAL AUTH GUARD (single source of truth)
     ===================================================== */
  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!cancelled && res.status === 401) {
          cleanupUI();
          router.replace("/login");
          return;
        }

        if (!cancelled) setAuthChecked(true);
      } catch {
        if (!cancelled) {
          cleanupUI();
          router.replace("/login");
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  /* =====================================================
     🧹 UI CLEANUP (logout / forced redirect)
     ===================================================== */
  function cleanupUI() {
    setDrawerOpen(false);
    document.body.classList.remove("drawer-open");
  }

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
     ⏳ WAIT UNTIL AUTH IS CONFIRMED
     ===================================================== */
  if (!authChecked) {
    return null; // no flicker, no UI leak
  }

  /* =====================================================
     ✅ NORMAL APP LAYOUT
     ===================================================== */
  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topbarGlobal}>
        <TopBar onMenuClick={toggleDrawer} />
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
