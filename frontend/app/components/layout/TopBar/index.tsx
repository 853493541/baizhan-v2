import React from "react";
import Image from "next/image";
import NavLink from "../NavLink";
import styles from "./styles.module.css";

export default function TopBar() {
  return (
    <div className={styles.wrap}>
      {/* ✅ App logo */}
      <div className={styles.left}>
        <Image src="/icons/app_icon.png" alt="logo" width={24} height={24} />
        <div className={styles.title}>百战 · 控制台</div>
      </div>

      {/* ✅ Global navigation */}
      <nav className={styles.nav}>
        <NavLink href="/">🏠 主页</NavLink>
        <NavLink href="/characters">🧩 角色仓库</NavLink>
        <NavLink href="/map">🗺️ 本周地图</NavLink>
        <NavLink href="/playground">📊 排表</NavLink>
      </nav>

      <div className={styles.right}>
        <span className={styles.version}>v0.1 draft</span>
      </div>
    </div>
  );
}
