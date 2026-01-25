"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./styles.module.css";
import UserMenu from "@/app/components/auth/UserMenu";

interface TopBarProps {
  onMenuClick?: () => void;
  username?: string | null; // ✅ injected from parent (AuthGate / LayoutShell)
}

export default function TopBar({ onMenuClick, username }: TopBarProps) {
  const handleMenuClick = useCallback(() => {
    if (onMenuClick) onMenuClick();

    const isOpen = document.body.classList.contains("drawer-open");
    document.body.classList.toggle("drawer-open", !isOpen);
  }, [onMenuClick]);

  return (
    <div className={styles.wrap}>
      {/* ☰ Hamburger */}
      <button className={styles.hamburger} onClick={handleMenuClick}>
        ☰
      </button>

      {/* Logo + Title */}
      <Link href="/" className={styles.titleWrap}>
        <Image
          src="/icons/app_icon.png"
          alt="logo"
          width={22}
          height={22}
          priority
        />
        <span className={styles.title}>百战异闻录</span>
      </Link>

      {/* Right side user menu */}
      <div className={styles.rightArea}>
        {username ? <UserMenu username={username} /> : null}
      </div>
    </div>
  );
}
