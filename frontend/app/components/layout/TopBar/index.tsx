"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./styles.module.css";

interface TopBarProps {
  onMenuClick?: () => void; // optional parent callback
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  
  /** Toggle drawer + apply body class */
  const handleMenuClick = useCallback(() => {
    // call parent if provided
    if (onMenuClick) onMenuClick();

    // toggle body class
    const isOpen = document.body.classList.contains("drawer-open");
    if (isOpen) {
      document.body.classList.remove("drawer-open");
    } else {
      document.body.classList.add("drawer-open");
    }
  }, [onMenuClick]);

  return (
    <div className={styles.wrap}>
      
      {/* Hamburger */}
      <button className={styles.hamburger} onClick={handleMenuClick}>
        ☰
      </button>

      {/* Logo + Title */}
      <Link href="/" className={styles.titleWrap}>
        <Image src="/icons/app_icon.png" alt="logo" width={22} height={22} />
        <span className={styles.title}>百战异闻录</span>
      </Link>

      {/* Search icon */}
      {/* <button className={styles.searchBtn}>🔍</button> */}
    </div>
  );
}
