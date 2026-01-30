"use client";

import React from "react";
import NavLink from "../NavLink";
import styles from "./styles.module.css";

export default function Sidebar() {
  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        {/* Primary */}
        <NavLink href="/">🏠 主页</NavLink>
        <NavLink href="/characters">🧩 全部角色</NavLink>
        <NavLink href="/playground">📊 本周排表</NavLink>
        <NavLink href="/ranking">🏆 排行榜</NavLink>

        {/* 🔽 Divider */}
        <div className={styles.divider} />

        {/* 统计 */}
        <div className={styles.section}>统计</div>
        <NavLink href="/stats/appearances">🐲 首领统计</NavLink>
        <NavLink href="/overallprogress">🧮 收集进度</NavLink>

        {/* 历史 */}
        <div className={styles.section}>历史</div>
        <NavLink href="/playground/history">📈 往期排表</NavLink>
        <NavLink href="/map/history">🗺 历史地图</NavLink>
        <NavLink href="/history">🕒 技能更新记录</NavLink>
         <NavLink href="/game">🎮 真传</NavLink>
      </nav>
    </div>
  );
}
