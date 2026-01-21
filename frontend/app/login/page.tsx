"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";
import { toastError } from "@/app/components/toast/toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "登录失败");
        setLoading(false);
        return;
      }

      router.replace("/");
    } catch {
      setError("网络错误，请稍后再试");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* App logo / name */}
        <div className={styles.logo}>百战异闻录</div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.subTitle}>请输入账号信息</div>
          <h1 className={styles.title}>欢迎回来</h1>
        </div>

        {/* Login form */}
        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <input
            className={styles.input}
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.loginBtn} disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>

        {/* Links */}
        <div className={styles.links}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => toastError("请联系管理员")}
          >
            忘记密码？
          </button>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => toastError("注册暂未开放")}
          >
            注册
          </button>
        </div>
      </div>
    </div>
  );
}
