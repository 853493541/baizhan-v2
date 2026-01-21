"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/* ===============================
   Display name mapping
=============================== */
const DISPLAY_NAME_MAP: Record<string, string> = {
  admin: "管理员",
  guest: "游客账号",
  wuxi: "五溪",
  douzhi: "豆子",
  juzi: "桔子",
  tianmei: "甜妹",
  catcake: "猫猫糕",
};

/* ===============================
   Access control (frontend UX)
=============================== */
const ALLOWED_USERS = new Set(["admin", "catcake"]);

/* ===============================
   Special accounts
=============================== */
const SPECIAL_USERS = new Set(["admin", "guest"]);

interface UserActivity {
  username: string;
  lastSeenAt: string | null;
  lastSeenIp: string | null;
}

export default function AdminActivityPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        /* ===============================
           1️⃣ Auth check
        =============================== */
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });

        if (meRes.status === 401) {
          router.replace("/login");
          return;
        }

        const meData = await meRes.json();
        const username = meData?.user?.username;

        if (!ALLOWED_USERS.has(username)) {
          router.replace("/");
          return;
        }

        /* ===============================
           2️⃣ Load activity
        =============================== */
        const res = await fetch(
          `${API_BASE}/api/admin/users/activity`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load activity");
        }

        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setError("无法加载访问记录");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  /* ===============================
     Helpers
  =============================== */
  function timeAgo(ts: string | null) {
    if (!ts) return "从未";

    const diff = Date.now() - new Date(ts).getTime();
    const min = Math.floor(diff / 60000);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);

    if (min < 1) return "刚刚";
    if (min < 60) return `${min} 分钟前`;
    if (hour < 24) return `${hour} 小时前`;
    return `${day} 天前`;
  }

  function displayName(username: string) {
    return DISPLAY_NAME_MAP[username] || username;
  }

  function sortByLastSeen(list: UserActivity[]) {
    return [...list].sort((a, b) => {
      if (!a.lastSeenAt && !b.lastSeenAt) return 0;
      if (!a.lastSeenAt) return 1;
      if (!b.lastSeenAt) return -1;
      return (
        new Date(b.lastSeenAt).getTime() -
        new Date(a.lastSeenAt).getTime()
      );
    });
  }

  /* ===============================
     Split + sort
  =============================== */
  const specialUsers = sortByLastSeen(
    users.filter((u) => SPECIAL_USERS.has(u.username))
  );

  const normalUsers = sortByLastSeen(
    users.filter((u) => !SPECIAL_USERS.has(u.username))
  );

  /* ===============================
     Render
  =============================== */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>访问记录</h1>

      </header>

      {loading && <div className={styles.loading}>加载中…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <>
                <section className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>最近登录</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {normalUsers.map((u) => (
                  <tr key={u.username}>
                    <td className={styles.username}>
                      {displayName(u.username)}
                    </td>
                    <td>{timeAgo(u.lastSeenAt)}</td>
                    <td className={styles.ip}>
                      {u.lastSeenIp ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ===============================
              Special accounts
          =============================== */}
          <section className={styles.card}>
    

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>最近登录</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {specialUsers.map((u) => (
                  <tr key={u.username}>
                    <td className={styles.username}>
                      {displayName(u.username)}
                    </td>
                    <td>{timeAgo(u.lastSeenAt)}</td>
                    <td className={styles.ip}>
                      {u.lastSeenIp ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ===============================
              Normal users
          =============================== */}

        </>
      )}
    </div>
  );
}
