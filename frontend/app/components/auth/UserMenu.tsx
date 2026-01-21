"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "./ChangePasswordModal";
import styles from "./UserMenu.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Props {
  username: string;
}

/* ===============================
   🩹 Band-aid display name mapping
   =============================== */
const DISPLAY_NAME_MAP: Record<string, string> = {
  admin: "管理员",
  wuxi: "五溪",
  douzi: "豆子",
  juzi: "桔子",
  tianmei: "甜妹",
  guest: "游客账号",
};

function getDisplayName(username: string) {
  return DISPLAY_NAME_MAP[username] ?? username;
}

function getAvatarLetter(displayName: string) {
  // If Chinese, use first char; otherwise uppercase first letter
  return displayName.charAt(0).toUpperCase();
}

export default function UserMenu({ username }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const displayName = getDisplayName(username);
  const avatarLetter = getAvatarLetter(displayName);

  /* ===============================
     Click-away + ESC (Google behavior)
     =============================== */
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /* ===============================
     Logout
     =============================== */
  async function logout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }

    setOpen(false);
    setShowChange(false);
    router.replace("/login");
  }

  return (
    <div className={styles.wrap} ref={wrapperRef}>
      {/* Avatar trigger */}
      <button
        className={styles.avatarBtn}
        onClick={() => setOpen(v => !v)}
        aria-label="账户菜单"
      >
        <div className={styles.avatarCircle}>
          {avatarLetter}
        </div>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {/* Profile header */}
          <div className={styles.profile}>
            <div className={styles.profileAvatar}>
              {avatarLetter}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                {displayName}
              </div>
              <div className={styles.profileHint}>已登录</div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Actions */}
          <button
            className={styles.menuItem}
            onClick={() => {
              setShowChange(true);
              setOpen(false);
            }}
          >
            <span className="material-symbols-outlined">key</span>
            修改密码
          </button>

          <button
            className={`${styles.menuItem} ${styles.logout}`}
            onClick={logout}
          >
            <span className="material-symbols-outlined">logout</span>
            退出登录
          </button>
        </div>
      )}

      {showChange && (
        <ChangePasswordModal
          onClose={() => {
            setShowChange(false);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
