"use client";

import React, { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./styles.module.css";
import UserMenu from "@/app/components/auth/UserMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface TopBarProps {
  onMenuClick?: () => void; // optional parent callback
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [username, setUsername] = useState<string | null>(null);

  /** Toggle drawer + apply body class */
  const handleMenuClick = useCallback(() => {
    if (onMenuClick) onMenuClick();

    const isOpen = document.body.classList.contains("drawer-open");
    if (isOpen) {
      document.body.classList.remove("drawer-open");
    } else {
      document.body.classList.add("drawer-open");
    }
  }, [onMenuClick]);

  /** Fetch current user once */
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.username) {
          setUsername(data.user.username);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  return (
    <div className={styles.wrap}>
      {/* Hamburger */}
      <button className={styles.hamburger} onClick={handleMenuClick}>
        ☰
      </button>

      {/* Logo + Title */}
      <Link href="/" className={styles.titleWrap}>
        <Image src="/icons/app_icon.png?v=20260122" alt="logo" width={22} height={22} />
        <span className={styles.title}>百战异闻录</span>
      </Link>

      {/* Right side spacer */}
      <div className={styles.rightArea}>
        {username && <UserMenu username={username} />}
      </div>
    </div>
  );
}
